import { band, hashOf, normalise } from '@vakilbench/core';
import type {
  Actor,
  DecisionProvider,
  Extract,
  ExtractCheck,
  Hash,
  IsoDate,
  Ledger,
  Party,
  TextLayer,
} from '@vakilbench/core';
import { RULES } from './extractors.ts';
import { lineAt, notebookView, questionFor, valueOf, type NotebookItem } from './view.ts';

export const NOTEBOOK: Actor = { kind: 'notebook', id: 'notebook' };

export type EngineReading = { engine: string; pages: string[][]; confidence?: number };

export function recordText(ledger: Ledger, source: Hash, readings: EngineReading[]): TextLayer {
  const [first, ...rest] = readings;
  if (!first || rest.length === 0) throw new Error('a text layer needs readings from at least two engines');
  const shape = (r: EngineReading) => JSON.stringify(r.pages.map((p) => p.length));
  if (rest.some((r) => shape(r) !== shape(first))) throw new Error('engines disagree on page or line count');
  const layer: TextLayer = {
    source,
    pages: first.pages.map((lines, p) => ({
      n: p + 1,
      lines: lines.map((_, l) => {
        const texts = readings.map((r) => r.pages[p]![l]!);
        const agreed = texts.every((t) => normalise(t) === normalise(texts[0]!));
        return {
          n: l + 1,
          text: agreed ? texts[0]! : '',
          readings: readings.map((r, e) => ({
            engine: r.engine,
            text: texts[e]!,
            confidence: r.confidence ?? 900,
          })) as TextLayer['pages'][number]['lines'][number]['readings'],
        };
      }),
    })),
  };
  ledger.append(NOTEBOOK, { type: 'text.recorded', layer });
  return layer;
}

type CheckResult = Omit<ExtractCheck, 'extract' | 'extractHash'>;

const verdict = (check: ExtractCheck['check'], ok: boolean, reason: string): CheckResult =>
  ok ? { check, outcome: 'pass' } : { check, outcome: 'fail', reason };

// Appending an unchanged verdict would only grow the ledger, which keeps every pass idempotent.
function record(ledger: Ledger, item: NotebookItem, result: CheckResult): void {
  const prior = item.checks.find((c) => c.check === result.check);
  if (prior && prior.outcome === result.outcome && prior.reason === result.reason) return;
  ledger.append(NOTEBOOK, {
    type: 'extract.checked',
    check: { extract: item.extract.id, extractHash: item.hash, ...result },
  });
}

function deterministicChecks(item: NotebookItem, layers: Map<Hash, TextLayer>): CheckResult[] {
  const { anchor } = item.extract;
  const line = lineAt(layers, anchor.source, anchor.page, anchor.line);
  const rule = RULES.find((r) => r.kind === item.extract.kind);
  const wanted = valueOf(item.extract);
  return [
    verdict(
      'ocr-agreement',
      !!line && line.text !== '' && line.readings.every((r) => normalise(r.text) === normalise(line.readings[0].text)),
      line ? 'engines_disagree' : 'no_such_line',
    ),
    verdict('anchor', !!line && line.text.includes(anchor.quote), 'quote_not_in_agreed_text'),
    verdict(
      'value-in-quote',
      !!rule && rule.find(anchor.quote).some((h) => valueOf(h.fields) === wanted),
      'value_not_in_quote',
    ),
  ];
}

export function extractAll(ledger: Ledger): Extract[] {
  const before = notebookView(ledger.events);
  for (const layer of before.layers) {
    for (const page of layer.pages) {
      for (const line of page.lines) {
        // A disagreed line has no agreed text; read the first engine so the disagreement is surfaced as a failed check.
        const text = line.text || line.readings[0].text;
        for (const rule of RULES) {
          rule.find(text).forEach((hit, n) => {
            const extract = {
              id: `${rule.kind}:${layer.source.slice(0, 8)}:p${page.n}:l${line.n}:${n}`,
              ...hit.fields,
              anchor: { source: layer.source, page: page.n, line: line.n, quote: hit.quote },
              extractor: { rule: rule.rule, version: 1 },
            } as Extract;
            if (before.byId(extract.id)?.hash === hashOf(extract)) return;
            ledger.append(NOTEBOOK, { type: 'extract.recorded', extract });
          });
        }
      }
    }
  }
  const after = notebookView(ledger.events);
  const layers = new Map(after.layers.map((l) => [l.source, l]));
  for (const item of after.items) {
    for (const result of deterministicChecks(item, layers)) record(ledger, item, result);
  }
  return after.items.map((i) => i.extract);
}

export type CaseRecord = { court: string; caseNumber: string; parties: Party[]; orderDates: IsoDate[]; firNumber?: string };
export type CaseRecordRepository = { find(court: string, caseNumber: string): CaseRecord | undefined };

const stripFir = (s: string) => normalise(s).replace(/^fir\s*no\.?\s*/, '');
const isFir = (value: string) => /^fir\b/i.test(value);

function crosschecked(extract: Extract): boolean {
  if (extract.kind === 'date') return extract.role === 'impugned-order' || extract.role === 'bail-refused';
  return extract.kind === 'party' || extract.kind === 'case-number';
}

function compareWithRecord(extract: Extract, rec: CaseRecord): CheckResult {
  const check = 'record-crosscheck';
  const found = (ok: boolean) => verdict(check, ok, 'not_in_case_record');
  switch (extract.kind) {
    case 'party':
      return found(rec.parties.some((p) => normalise(p.name) === normalise(extract.value.name)));
    case 'date':
      return found(rec.orderDates.includes(extract.value));
    case 'case-number':
      if (!isFir(extract.value)) return found(normalise(extract.value) === normalise(rec.caseNumber));
      // The record's firNumber is the only place an FIR number can be checked.
      return rec.firNumber === undefined
        ? { check, outcome: 'unresolved', reason: 'no_fir_in_record' }
        : found(stripFir(extract.value) === stripFir(rec.firNumber));
    default:
      throw new Error(`no crosscheck for ${extract.kind}`);
  }
}

export function crosscheck(ledger: Ledger, repo: CaseRecordRepository): void {
  const matter = ledger.bodies('matter.opened')[0]?.matter;
  if (!matter) throw new Error('crosscheck needs a matter.opened event');
  const rec = repo.find(matter.impugnedOrder.court, matter.impugnedOrder.caseNumber);
  for (const item of notebookView(ledger.events).items) {
    if (!crosschecked(item.extract)) continue;
    record(
      ledger,
      item,
      rec
        ? compareWithRecord(item.extract, rec)
        : { check: 'record-crosscheck', outcome: 'unresolved', reason: 'no_case_record' },
    );
  }
}

export async function secondOpinion(ledger: Ledger, decider: DecisionProvider): Promise<void> {
  for (const item of notebookView(ledger.events).items) {
    if (item.checks.some((c) => c.check === 'second-opinion')) continue;
    const score = await decider.ask(item.line, questionFor(item.extract));
    const b = band(score);
    record(
      ledger,
      item,
      b === 'yes'
        ? { check: 'second-opinion', outcome: 'pass', score }
        : b === 'no'
          ? { check: 'second-opinion', outcome: 'fail', reason: 'model_disagrees', score }
          : { check: 'second-opinion', outcome: 'unresolved', reason: 'model_unsure', score },
    );
  }
}

export function review(ledger: Ledger, lawyer: Actor, extractId: string, confirm: boolean, note?: string): void {
  const item = notebookView(ledger.events).byId(extractId);
  if (!item) throw new Error(`no extract ${extractId}`);
  ledger.append(lawyer, {
    type: 'extract.reviewed',
    extract: extractId,
    extractHash: item.hash,
    confirm,
    ...(note === undefined ? {} : { note }),
  });
}
