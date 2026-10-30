import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  fixtureDecider,
  hashOf,
  Ledger,
  type Actor,
  type Citation,
  type Judgment,
  type Paragraph,
} from '@vakilbench/core';
import {
  citationView,
  supportQuestion,
  VERIFIER,
  verifyAll,
  verifyMention,
  type CitationMention,
  type JudgmentSource,
  type Treatment,
} from '../src/index.ts';

const notebook: Actor = { kind: 'notebook', id: 'notebook' };
const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };

const para = (n: number, voice: Paragraph['voice'], text: string): Paragraph => ({ n, voice, text });

const judgment = (id: string, title: string, decided: string, benchStrength: number, citation: Citation): Judgment => ({
  id,
  citations: [citation],
  title,
  decided,
  benchStrength,
  judges: ['A', 'B'],
  paragraphs: [
    para(1, 'facts', 'The appellant was arrested on the night of the incident.'),
    para(2, 'submission', 'Counsel submits that custody beyond two years is unconstitutional.'),
    para(3, 'holding', 'Prolonged custody without trial   violates Article 21 of the Constitution.'),
  ],
});

const base = judgment('j-base', 'Ravi Shankar v. State of Punjab', '2020-01-10', 3, { scheme: 'INSC', year: 2020, number: 11 });
const larger = judgment('j-larger', 'Anil Rao v. Union of India', '2022-05-05', 5, { scheme: 'INSC', year: 2022, number: 50 });
const equal = judgment('j-equal', 'Bela Das v. State of Kerala', '2022-06-06', 3, { scheme: 'INSC', year: 2022, number: 60 });
const smaller = judgment('j-smaller', 'Chand Mal v. State of Goa', '2021-02-02', 2, { scheme: 'INSC', year: 2021, number: 20 });
const earlierLarger = judgment('j-earlier', 'Deep Rani v. State of Assam', '2019-03-03', 5, { scheme: 'INSC', year: 2019, number: 30 });

function source(
  tier: JudgmentSource['tier'],
  snapshot: string,
  judgments: Judgment[],
  treatments: Record<string, Treatment[]> = {},
): JudgmentSource {
  return {
    tier,
    snapshot,
    find: (c) => judgments.filter((j) => j.citations.some((x) => JSON.stringify(x) === JSON.stringify(c))),
    treatments: (id) => treatments[id] ?? [],
  };
}

let seq = 0;
const mention = (over: Partial<CitationMention> = {}): CitationMention => {
  seq += 1;
  return {
    id: `m-${seq}`,
    kind: 'citation',
    raw: 'Ravi Shankar v. State of Punjab, 2020 INSC 11',
    citation: { scheme: 'INSC', year: 2020, number: 11 },
    pinpoint: 3,
    quote: 'violates Article 21',
    proposition: 'Prolonged custody violates Article 21.',
    anchor: { source: 'a'.repeat(64), page: 1, line: 1, quote: 'x' },
    extractor: { rule: 'citation.v1', version: 1 },
    ...over,
  } as CitationMention;
};

const tiers = [source('corpus', '2026-03-31', [base, larger, equal, smaller, earlierLarger])];
const yes = fixtureDecider({}, 950);

test('a good citation verifies at all four levels and records the deciding tier', async () => {
  const v = await verifyMention(mention(), tiers, yes);
  assert.equal(v.tier, 'corpus');
  assert.equal(v.snapshot, '2026-03-31');
  assert.equal(v.judgment, 'j-base');
  assert.deepEqual(
    [v.identity, v.pinpoint, v.support, v.standing].map((l) => l.outcome),
    ['verified', 'verified', 'verified', 'verified'],
  );
  assert.equal(v.scores?.length, 1);
  assert.equal(v.scores?.[0]?.probability, 950);
});

test('first tier with a hit decides tier and snapshot', async () => {
  const first = source('sc-official', '2026-10-30', [base]);
  const second = source('corpus', '2026-03-31', [base]);
  assert.equal((await verifyMention(mention(), [first, second], yes)).tier, 'sc-official');
  assert.equal((await verifyMention(mention(), [source('indian-kanoon', 'k', []), second], yes)).tier, 'corpus');
});

test('a citation in no tier is unresolved, never failed, and nothing else is checked', async () => {
  const v = await verifyMention(mention({ citation: { scheme: 'INSC', year: 2001, number: 1 } }), tiers, yes);
  assert.equal(v.tier, 'none');
  assert.deepEqual(v.identity, { outcome: 'unresolved', reason: 'not_in_any_source' });
  for (const l of [v.pinpoint, v.support, v.standing]) assert.equal(l.outcome, 'not_checked');
  assert.equal(v.judgment, undefined);
});

test('an unparsed citation fails identity', async () => {
  const v = await verifyMention(mention({ citation: null }), tiers, yes);
  assert.deepEqual(v.identity, { outcome: 'failed', reason: 'unparsed_citation' });
  assert.equal(v.pinpoint.outcome, 'not_checked');
});

test('two judgments behind one citation are ambiguous', async () => {
  const twin = { ...base, id: 'j-twin' };
  const v = await verifyMention(mention(), [source('corpus', 's', [base, twin])], yes);
  assert.deepEqual(v.identity, { outcome: 'unresolved', reason: 'ambiguous' });
  assert.equal(v.judgment, undefined);
});

test('party names are matched on their first significant word', async () => {
  const wrong = await verifyMention(mention({ raw: 'Mohan Lal v. State of Punjab, 2020 INSC 11' }), tiers, yes);
  assert.deepEqual(wrong.identity, { outcome: 'failed', reason: 'party_mismatch' });
  assert.equal(wrong.support.outcome, 'not_checked');
  const wrongSecond = await verifyMention(mention({ raw: 'Ravi Shankar v. State of Haryana, 2020 INSC 11' }), tiers, yes);
  assert.equal(wrongSecond.identity.reason, 'party_mismatch');
  const skipsFillers = await verifyMention(mention({ raw: 'Ravi Shankar v. The State of Punjab (2020 INSC 11)' }), tiers, yes);
  assert.equal(skipsFillers.identity.outcome, 'verified');
  const noName = await verifyMention(mention({ raw: '2020 INSC 11' }), tiers, yes);
  assert.equal(noName.identity.outcome, 'verified');
});

test('pinpoint: missing paragraph, missing quote, no pinpoint, and whitespace/case-insensitive quote', async () => {
  assert.deepEqual((await verifyMention(mention({ pinpoint: 99 }), tiers, yes)).pinpoint, {
    outcome: 'failed',
    reason: 'no_such_paragraph',
  });
  assert.deepEqual((await verifyMention(mention({ quote: 'bail is the rule' }), tiers, yes)).pinpoint, {
    outcome: 'failed',
    reason: 'quote_not_in_paragraph',
  });
  assert.equal((await verifyMention(mention({ quote: 'WITHOUT TRIAL violates' }), tiers, yes)).pinpoint.outcome, 'verified');
  const none = await verifyMention(mention({ pinpoint: undefined, quote: undefined }), tiers, yes);
  assert.equal(none.pinpoint.outcome, 'not_checked');
  assert.equal(none.support.outcome, 'not_checked');
  assert.equal((await verifyMention(mention({ quote: undefined }), tiers, yes)).pinpoint.outcome, 'verified');
});

test('support: counsel submissions and facts are not holdings, and the model never overrides that', async () => {
  const sub = await verifyMention(mention({ pinpoint: 2, quote: undefined }), tiers, yes);
  assert.deepEqual(sub.support, { outcome: 'failed', reason: 'cites_submission_as_holding' });
  assert.equal(sub.scores, undefined);
  const facts = await verifyMention(mention({ pinpoint: 1, quote: undefined }), tiers, yes);
  assert.deepEqual(facts.support, { outcome: 'failed', reason: 'cites_facts_as_holding' });
});

test('support: Jev/Clef bands decide, and no decider means a second reader is needed', async () => {
  const m = mention();
  const key = supportQuestion(m, 'j-base');
  const run = (p: number | null) => verifyMention(m, tiers, p === null ? undefined : fixtureDecider({ [key]: p }));
  assert.equal((await run(920)).support.outcome, 'verified');
  assert.deepEqual((await run(40)).support, { outcome: 'failed', reason: 'model_disagrees' });
  assert.deepEqual((await run(500)).support, { outcome: 'unresolved', reason: 'model_unsure' });
  const noModel = await run(null);
  assert.deepEqual(noModel.support, { outcome: 'unresolved', reason: 'needs_second_reader' });
  assert.equal(noModel.scores, undefined);
  assert.equal((await verifyMention(mention({ proposition: undefined }), tiers, yes)).support.outcome, 'not_checked');
});

test('supportQuestion is stable across mention ids and trailing punctuation', () => {
  const a = supportQuestion(mention({ proposition: 'Prolonged custody violates Article 21.' }), 'j-1');
  const b = supportQuestion(mention({ proposition: '  prolonged custody violates article 21 ' }), 'j-1');
  assert.equal(a, b);
  assert.notEqual(a, supportQuestion(mention(), 'j-2'));
});

test('standing: later overruling by an equal or larger bench fails, smaller bench is ignored', async () => {
  const treat = (by: Judgment): JudgmentSource[] => [
    source('corpus', 's', [base], { 'j-base': [{ by, relation: 'overrules', paragraph: 4 }] }),
  ];
  assert.deepEqual((await verifyMention(mention(), treat(larger), yes)).standing, {
    outcome: 'failed',
    reason: 'overruled_by:j-larger',
  });
  assert.deepEqual((await verifyMention(mention(), treat(equal), yes)).standing, {
    outcome: 'failed',
    reason: 'overruled_by:j-equal',
  });
  assert.deepEqual((await verifyMention(mention(), treat(smaller), yes)).standing, {
    outcome: 'verified',
    reason: 'smaller_bench_overruling_ignored:j-smaller',
  });
  assert.equal((await verifyMention(mention(), treat(earlierLarger), yes)).standing.outcome, 'verified');
});

test('standing: distinguishing and following leave the judgment good law', async () => {
  const t = source('corpus', 's', [base], {
    'j-base': [
      { by: larger, relation: 'distinguishes', paragraph: 9 },
      { by: equal, relation: 'follows', paragraph: 2 },
    ],
  });
  assert.deepEqual((await verifyMention(mention(), [t], yes)).standing, {
    outcome: 'verified',
    reason: 'distinguished_in:j-larger',
  });
});

test('verdicts are reproducible and bound to the mention hash', async () => {
  const m = mention();
  const a = await verifyMention(m, tiers, yes);
  const b = await verifyMention(structuredClone(m), tiers, yes);
  assert.deepEqual(a, b);
  assert.equal(a.mentionHash, hashOf(m));
  assert.notEqual((await verifyMention({ ...m, quote: 'without trial' }, tiers, yes)).mentionHash, a.mentionHash);
});

test('verifyAll writes as the verifier, skips unchanged mentions and re-verifies changed ones', async () => {
  const ledger = new Ledger();
  const record = (m: CitationMention) => ledger.append(notebook, { type: 'extract.recorded', extract: m });
  const verdicts = () => ledger.bodies('citation.verified').length;
  const m1 = mention();
  const m2 = mention({ citation: { scheme: 'INSC', year: 1999, number: 9 } });
  record(m1);
  record(m2);
  const first = await verifyAll(ledger, [m1, m2], tiers, yes);
  assert.equal(first.length, 2);
  assert.equal(verdicts(), 2);
  assert.ok(ledger.events.filter((e) => e.body.type === 'citation.verified').every((e) => e.actor.kind === 'verifier' && e.actor.id === VERIFIER.id));

  const again = await verifyAll(ledger, [m1, m2], tiers, yes);
  assert.equal(verdicts(), 2);
  assert.deepEqual(again, first);

  const edited = { ...m1, quote: 'without trial' } as CitationMention;
  record(edited);
  assert.equal(citationView(ledger.events).get(m1.id), undefined, 'an edited mention has no verdict until re-verified');
  await verifyAll(ledger, [edited, m2], tiers, yes);
  assert.equal(verdicts(), 3);
  const view = citationView(ledger.events);
  assert.equal(view.get(m1.id)?.mentionHash, hashOf(edited));
  assert.equal(view.get(m2.id)?.identity.reason, 'not_in_any_source');
});

test('only the verifier may write verdicts', async () => {
  const ledger = new Ledger();
  const v = await verifyMention(mention(), tiers, yes);
  assert.throws(() => ledger.append(notebook, { type: 'citation.verified', verification: v }), /may not write/);
  assert.throws(() => ledger.append(lawyer, { type: 'citation.verified', verification: v }), /may not write/);
});
