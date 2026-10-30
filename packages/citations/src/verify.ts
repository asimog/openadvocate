import {
  band,
  hashOf,
  normalise,
  type Actor,
  type Citation,
  type CitationVerification,
  type DecisionProvider,
  type Extract,
  type Judgment,
  type Ledger,
  type LedgerEvent,
  type Level,
  type Paragraph,
  type Score,
} from '@vakilbench/core';

export const VERIFIER: Actor = { kind: 'verifier', id: 'citation-verifier' };

export type Treatment = { by: Judgment; relation: 'overrules' | 'distinguishes' | 'follows'; paragraph: number };

export type JudgmentSource = {
  tier: 'sc-official' | 'corpus' | 'indian-kanoon';
  snapshot: string;
  find(c: Citation): Judgment[];
  treatments(judgmentId: string): Treatment[];
};

export type CitationMention = Extract & { kind: 'citation' };

const trimmedProposition = (s: string): string => normalise(s).replace(/[\s.;,]+$/, '');

// The key carries no mention id, so a fixture or a cache can be written before any extract exists.
export function supportQuestion(mention: CitationMention, judgmentId: string): string {
  return `Does paragraph ${mention.pinpoint ?? 0} of judgment ${judgmentId} support the proposition: ${trimmedProposition(mention.proposition ?? '')}?`;
}

const level = (outcome: Level['outcome'], reason?: string): Level => (reason === undefined ? { outcome } : { outcome, reason });

const SKIPPED_WORDS = new Set(['state', 'of', 'the', 'union']);

const firstSignificantWord = (name: string): string | undefined =>
  normalise(name)
    .split(/[^a-z0-9]+/)
    .find((w) => w !== '' && !SKIPPED_WORDS.has(w));

// Reads `A v. B` out of the mention text. Returns the first significant word of each side.
function partyWords(raw: string): [string, string] | null {
  const m = /^(.*?)\s+(?:v\.?|vs\.?)\s+(.*)$/i.exec(raw);
  if (!m) return null;
  const right = (m[2] ?? '').split(/[,(\[]|\b\d{4}\s+INSC\b/i)[0] ?? '';
  const a = firstSignificantWord(m[1] ?? '');
  const b = firstSignificantWord(right);
  return a && b ? [a, b] : null;
}

function partiesMatchTitle(raw: string, title: string): boolean {
  const words = partyWords(raw);
  if (!words) return true;
  const titleWords = new Set(normalise(title).split(/[^a-z0-9]+/));
  return words.every((w) => titleWords.has(w));
}

function checkStanding(judgment: Judgment, source: JudgmentSource): Level {
  const reasons: string[] = [];
  for (const t of source.treatments(judgment.id)) {
    if (t.relation === 'overrules' && t.by.decided > judgment.decided) {
      if (t.by.benchStrength >= judgment.benchStrength) return level('failed', `overruled_by:${t.by.id}`);
      reasons.push(`smaller_bench_overruling_ignored:${t.by.id}`);
    } else if (t.relation === 'distinguishes') {
      reasons.push(`distinguished_in:${t.by.id}`);
    }
  }
  return level('verified', reasons.length > 0 ? reasons.join('; ') : undefined);
}

function checkPinpoint(mention: CitationMention, paragraph: Paragraph | undefined): Level {
  if (mention.pinpoint === undefined) return level('not_checked');
  if (!paragraph) return level('failed', 'no_such_paragraph');
  if (mention.quote !== undefined && !normalise(paragraph.text).includes(normalise(mention.quote))) {
    return level('failed', 'quote_not_in_paragraph');
  }
  return level('verified');
}

async function checkSupport(
  mention: CitationMention,
  judgment: Judgment,
  paragraph: Paragraph | undefined,
  decider: DecisionProvider | undefined,
): Promise<{ level: Level; score?: Score }> {
  if (mention.proposition === undefined) return { level: level('not_checked') };
  if (!paragraph) return { level: level('not_checked', 'no_pinpoint_paragraph') };
  if (paragraph.voice === 'submission') return { level: level('failed', 'cites_submission_as_holding') };
  if (paragraph.voice === 'facts') return { level: level('failed', 'cites_facts_as_holding') };
  if (!decider) return { level: level('unresolved', 'needs_second_reader') };
  const score = await decider.ask(paragraph.text, supportQuestion(mention, judgment.id));
  const b = band(score);
  if (b === 'yes') return { level: level('verified'), score };
  if (b === 'no') return { level: level('failed', 'model_disagrees'), score };
  return { level: level('unresolved', 'model_unsure'), score };
}

export async function verifyMention(
  mention: CitationMention,
  tiers: JudgmentSource[],
  decider?: DecisionProvider,
): Promise<CitationVerification> {
  const rest = () => ({ pinpoint: level('not_checked'), support: level('not_checked'), standing: level('not_checked') });
  const base = { mention: mention.id, mentionHash: hashOf(mention) };

  if (!mention.citation) {
    return { ...base, tier: 'none', snapshot: '', identity: level('failed', 'unparsed_citation'), ...rest() };
  }

  for (const source of tiers) {
    const found = [...new Map(source.find(mention.citation).map((j) => [j.id, j])).values()];
    if (found.length === 0) continue;
    const decided = { tier: source.tier, snapshot: source.snapshot };

    const [judgment] = found;
    if (found.length > 1 || !judgment) {
      return { ...base, ...decided, identity: level('unresolved', 'ambiguous'), ...rest() };
    }
    if (!partiesMatchTitle(mention.raw, judgment.title)) {
      return { ...base, ...decided, identity: level('failed', 'party_mismatch'), ...rest() };
    }

    const paragraph =
      mention.pinpoint === undefined ? undefined : judgment.paragraphs.find((p) => p.n === mention.pinpoint);
    const support = await checkSupport(mention, judgment, paragraph, decider);
    return {
      ...base,
      judgment: judgment.id,
      ...decided,
      identity: level('verified'),
      pinpoint: checkPinpoint(mention, paragraph),
      support: support.level,
      standing: checkStanding(judgment, source),
      ...(support.score ? { scores: [support.score] } : {}),
    };
  }

  return { ...base, tier: 'none', snapshot: '', identity: level('unresolved', 'not_in_any_source'), ...rest() };
}

export function citationView(events: readonly LedgerEvent[]): Map<string, CitationVerification> {
  const view = new Map<string, CitationVerification>();
  for (const e of events) {
    if (e.body.type === 'citation.verified') view.set(e.body.verification.mention, e.body.verification);
  }
  return view;
}

export async function verifyAll(
  ledger: Ledger,
  mentions: CitationMention[],
  tiers: JudgmentSource[],
  decider?: DecisionProvider,
): Promise<CitationVerification[]> {
  const view = citationView(ledger.events);
  const out: CitationVerification[] = [];
  for (const mention of mentions) {
    // Always re-verify: a newly reachable source (e.g. a lawyer's capture from the Supreme Court site)
    // can settle an unresolved citation. Append only when the verdict changed, so reruns converge.
    const verification = await verifyMention(mention, tiers, decider);
    const prior = view.get(mention.id);
    if (prior && hashOf(prior) === hashOf(verification)) {
      out.push(prior);
      continue;
    }
    ledger.append(VERIFIER, { type: 'citation.verified', verification });
    view.set(mention.id, verification);
    out.push(verification);
  }
  return out;
}
