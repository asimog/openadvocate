import { assertValid, hashOf, normalise, type CitationVerification, type EvalReport, type Extract, type LedgerEvent } from '@vakilbench/core';
import { citationView, type CitationMention } from '@vakilbench/citations';
import { PLANTED_LOCATIONS } from './gm01.ts';

// The evaluation agent. It reads only what the workspace wrote to the ledger and compares it with a key
// the workspace never sees.

type Outcome = CitationVerification['identity']['outcome'];

export type ExpectedExtract = { required: boolean } & (
  | { kind: 'date'; value: string; role: string }
  | { kind: 'party'; name: string }
  | { kind: 'statute'; act: string; section: string }
  | { kind: 'case-number'; value: string }
  | { kind: 'citation'; cite: string }
);

export type ExpectedCitation = {
  cite: string;
  label: string;
  identity: Outcome;
  pinpoint: Outcome;
  support: Outcome;
  standing: Outcome;
};

export type PlantedDefect = { id: string; description: string; source: string; page: number; line: number };

export const ANSWER_KEY = {
  matter: 'gm-01',
  // Optional extracts are true but sit on a line the engines read differently, or repeat a number
  // that another extract already covers. Finding them is not required, and finding them is not wrong.
  extracts: [
    { kind: 'date', value: '2026-08-14', role: 'impugned-order', required: true },
    { kind: 'date', value: '2024-06-29', role: 'fir', required: true },
    { kind: 'date', value: '2024-07-03', role: 'custody-from', required: true },
    { kind: 'date', value: '2024-06-28', role: 'offence', required: false },
    { kind: 'party', name: 'Rakesh Kumar', required: true },
    { kind: 'party', name: 'State (NCT of Delhi)', required: true },
    { kind: 'statute', act: 'IPC', section: '307', required: true },
    { kind: 'statute', act: 'IPC', section: '34', required: true },
    { kind: 'case-number', value: '1234/2026', required: true },
    { kind: 'case-number', value: '210/2024', required: false },
    { kind: 'citation', cite: '2021 INSC 114', required: true },
    { kind: 'citation', cite: '2022 INSC 640', required: true },
    { kind: 'citation', cite: '(2024) 2 SCC 391', required: true },
    { kind: 'citation', cite: '2018 INSC 905', required: true },
    { kind: 'citation', cite: '2026 INSC 311', required: true },
    { kind: 'citation', cite: '(2019) 7 SCC 612', required: true },
    { kind: 'citation', cite: '(2019) 3 SCC 456', required: true },
  ] as ExpectedExtract[],
  // A planted defect is caught when no extract anchored on its line passes every check.
  plantedDefects: [
    {
      id: 'ocr-disagreement',
      description: 'The FIR date of occurrence is read as 28.06.2024 by one engine and 28.08.2024 by the other',
      ...PLANTED_LOCATIONS.ocrDisagreement,
    },
    {
      id: 'wrong-case-number',
      description: 'The custody certificate gives BAIL APPLN. 1243/2026, not the impugned order case number',
      ...PLANTED_LOCATIONS.wrongCaseNumber,
    },
  ] as PlantedDefect[],
  citations: [
    { label: 'a', cite: '2021 INSC 114', identity: 'verified', pinpoint: 'verified', support: 'verified', standing: 'verified' },
    { label: 'b', cite: '2022 INSC 640', identity: 'verified', pinpoint: 'failed', support: 'failed', standing: 'verified' },
    { label: 'c', cite: '(2024) 2 SCC 391', identity: 'verified', pinpoint: 'verified', support: 'failed', standing: 'verified' },
    { label: 'd', cite: '2018 INSC 905', identity: 'verified', pinpoint: 'verified', support: 'verified', standing: 'failed' },
    { label: 'e', cite: '2026 INSC 311', identity: 'verified', pinpoint: 'verified', support: 'verified', standing: 'verified' },
    { label: 'f', cite: '(2019) 7 SCC 612', identity: 'unresolved', pinpoint: 'not_checked', support: 'not_checked', standing: 'not_checked' },
    { label: 'g', cite: '(2019) 3 SCC 456', identity: 'verified', pinpoint: 'verified', support: 'verified', standing: 'verified' },
  ] as ExpectedCitation[],
} as const;

const permille = (n: number, d: number): number => (d === 0 ? 1000 : Math.round((1000 * n) / d));

type Metric = EvalReport['metrics'][number];

// Targets of zero count something that must not happen, so lower is better there.
const met = (m: Metric): boolean => (m.target === 0 ? m.value <= m.target : m.value >= m.target);

function report(suite: EvalReport['suite'], metrics: Metric[]): EvalReport {
  return assertValid('EvalReport', { matter: ANSWER_KEY.matter, suite, metrics, pass: metrics.every(met) });
}

export const sameExtract = (e: Extract, x: ExpectedExtract): boolean => {
  if (e.kind !== x.kind) return false;
  switch (x.kind) {
    case 'date':
      return e.kind === 'date' && e.value === x.value && e.role === x.role;
    case 'party':
      return e.kind === 'party' && normalise(e.value.name) === normalise(x.name);
    case 'statute':
      return e.kind === 'statute' && e.act === x.act && e.section === x.section;
    case 'case-number':
      return e.kind === 'case-number' && normalise(e.value).includes(normalise(x.value));
    case 'citation':
      return e.kind === 'citation' && normalise(e.raw).includes(normalise(x.cite));
  }
};

function notebookReport(events: readonly LedgerEvent[]): EvalReport {
  const extracts = new Map<string, Extract>();
  const outcomes = new Map<string, Map<string, string>>();
  for (const { body } of events) {
    if (body.type === 'extract.recorded') extracts.set(body.extract.id, body.extract);
    else if (body.type === 'extract.checked') {
      const mine = outcomes.get(body.check.extract) ?? new Map<string, string>();
      mine.set(body.check.check, body.check.outcome);
      outcomes.set(body.check.extract, mine);
    }
  }
  const recorded = [...extracts.values()];
  const clean = (e: Extract) => [...(outcomes.get(e.id)?.values() ?? [])].every((o) => o === 'pass');

  const required = ANSWER_KEY.extracts.filter((x) => x.required);
  const found = required.filter((x) => recorded.some((e) => sameExtract(e, x)));
  const cleanOnes = recorded.filter(clean);
  const cleanAndTrue = cleanOnes.filter((e) => ANSWER_KEY.extracts.some((x) => sameExtract(e, x)));
  const caught = ANSWER_KEY.plantedDefects.filter(
    (p) => !recorded.some((e) => e.anchor.source === p.source && e.anchor.page === p.page && e.anchor.line === p.line && clean(e)),
  );

  return report('notebook', [
    { name: 'extract recall', value: permille(found.length, required.length), target: 1000 },
    { name: 'extract precision', value: permille(cleanAndTrue.length, cleanOnes.length), target: 1000 },
    { name: 'planted defect catch rate', value: permille(caught.length, ANSWER_KEY.plantedDefects.length), target: 1000 },
  ]);
}

function citationsReport(events: readonly LedgerEvent[]): EvalReport {
  const mentions = new Map<string, CitationMention>();
  for (const { body } of events) {
    if (body.type === 'extract.recorded' && body.extract.kind === 'citation') {
      mentions.set(body.extract.id, body.extract as CitationMention);
    }
  }
  const view = citationView(events);
  const current = [...mentions.values()].flatMap((m) => {
    const v = view.get(m.id);
    return v && v.mentionHash === hashOf(m) ? [{ mention: m, verification: v }] : [];
  });

  const levels = ['identity', 'pinpoint', 'support', 'standing'] as const;
  const right = { identity: 0, pinpoint: 0, support: 0, standing: 0 };
  let falseVerified = 0;
  for (const expected of ANSWER_KEY.citations) {
    const hit = current.find((c) => normalise(c.mention.raw).includes(normalise(expected.cite)));
    for (const level of levels) {
      const actual = hit?.verification[level].outcome;
      if (actual === expected[level]) right[level] += 1;
      else if (actual === 'verified') falseVerified += 1;
    }
  }
  const total = ANSWER_KEY.citations.length;
  return report('citations', [
    ...levels.map((level) => ({ name: `${level} accuracy`, value: permille(right[level], total), target: 1000 })),
    { name: 'false-verified count', value: Math.min(falseVerified, 1000), target: 0 },
  ]);
}

export function evaluate(events: readonly LedgerEvent[], suite: 'notebook' | 'citations'): EvalReport {
  return suite === 'notebook' ? notebookReport(events) : citationsReport(events);
}
