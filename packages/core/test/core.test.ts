import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { test } from 'node:test';
import {
  addSource,
  canonical,
  decide,
  issueReceipt,
  openMatter,
  propose,
  verifyChain,
  verifyReceipt,
  view,
  type Actor,
  type Claim,
  type ClaimId,
  type Hash,
} from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };
const agent: Actor = { kind: 'agent', id: 'extractor' };
const id = (s: string) => s as ClaimId;

function setup() {
  const matter = openMatter();
  const order = new TextEncoder().encode('impugned order');
  const source = addSource(matter, lawyer, order, [
    'The petitioner has been in custody since 28 June 2024.',
    'Bail is refused.',
  ], { mediaType: 'application/pdf', origin: 'upload' });
  return { matter, source };
}

const fact = (source: Hash, quote: string, extra: Partial<Claim> = {}): Claim => ({
  id: id('f1'),
  kind: 'fact',
  factType: 'date',
  text: 'Custody began on 28 June 2024',
  anchors: [{ source, page: 1, quote }],
  dependsOn: [],
  ...extra,
} as Claim);

test('canonical JSON is key-order independent', () => {
  assert.equal(canonical({ b: 1, a: [true, null] }), canonical({ a: [true, null], b: 1 }));
  assert.throws(() => canonical({ x: 0.5 }), /safe integers only/);
});

test('ledger chain detects tampering', () => {
  const { matter, source } = setup();
  propose(matter, agent, fact(source, 'in custody since 28 June 2024'));
  assert.equal(verifyChain(matter.ledger.events).ok, true);
  const forged = structuredClone([...matter.ledger.events]);
  forged[1]!.actor = lawyer;
  assert.deepEqual(verifyChain(forged), { ok: false, brokenAt: 2 });
});

test('anchored fact is pending until a lawyer accepts it', () => {
  const { matter, source } = setup();
  const checks = propose(matter, agent, fact(source, 'IN   custody since 28 June 2024'));
  assert.deepEqual(checks.map((c) => c.outcome), ['pass']);
  assert.equal(view(matter.ledger.events).status(id('f1')), 'pending');
  decide(matter, lawyer, id('f1'), true);
  assert.equal(view(matter.ledger.events).status(id('f1')), 'verified');
});

test('quote missing from its source fails and stays failed after acceptance', () => {
  const { matter, source } = setup();
  propose(matter, agent, fact(source, 'in custody since 1 January 2020'));
  decide(matter, lawyer, id('f1'), true);
  assert.equal(view(matter.ledger.events).status(id('f1')), 'failed');
});

test('missing source is unresolved, not failed', () => {
  const { matter } = setup();
  propose(matter, agent, fact('0'.repeat(64) as Hash, 'anything'));
  assert.equal(view(matter.ledger.events).status(id('f1')), 'unresolved');
});

test('agents cannot decide', () => {
  const { matter, source } = setup();
  propose(matter, agent, fact(source, 'Bail is refused', { anchors: [{ source, page: 2, quote: 'Bail is refused' }] }));
  assert.throws(() => decide(matter, agent, id('f1'), true), /only a lawyer/);
});

test('editing a verified claim resets it to pending', () => {
  const { matter, source } = setup();
  propose(matter, agent, fact(source, 'since 28 June 2024'));
  decide(matter, lawyer, id('f1'), true);
  propose(matter, agent, fact(source, 'since 28 June 2024', { text: 'Custody began in June 2024' }));
  assert.equal(view(matter.ledger.events).status(id('f1')), 'pending');
});

test('a claim depending on a rejected claim is blocked', () => {
  const { matter, source } = setup();
  propose(matter, agent, fact(source, 'since 28 June 2024'));
  propose(matter, agent, {
    id: id('a1'),
    kind: 'argument',
    text: 'Long custody justifies bail',
    anchors: [{ source, page: 1, quote: 'in custody' }],
    dependsOn: [id('f1')],
  });
  decide(matter, lawyer, id('f1'), false, 'wrong date');
  decide(matter, lawyer, id('a1'), true);
  const v = view(matter.ledger.events);
  assert.equal(v.status(id('f1')), 'rejected');
  assert.equal(v.status(id('a1')), 'blocked');
});

test('unparseable citation fails', () => {
  const { matter, source } = setup();
  const checks = propose(matter, agent, {
    id: id('c1'),
    kind: 'citation',
    cite: 'AIR 2024 SC whatever',
    text: 'Authority on bail',
    anchors: [{ source, page: 2, quote: 'Bail is refused' }],
    dependsOn: [],
  });
  assert.deepEqual(checks.map((c) => [c.gate, c.outcome]), [
    ['citation-parses', 'fail'],
    ['anchored', 'pass'],
  ]);
});

test('receipt covers only verified claims and binds the document bytes', () => {
  const { matter, source } = setup();
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const filing = new TextEncoder().encode('%PDF filing');
  propose(matter, agent, fact(source, 'since 28 June 2024'));
  assert.throws(() => issueReceipt(matter.ledger.events, filing, [id('f1')], privateKey), /pending, not verified/);

  decide(matter, lawyer, id('f1'), true);
  const signed = issueReceipt(matter.ledger.events, filing, [id('f1')], privateKey);
  assert.equal(verifyReceipt(signed, publicKey, filing), true);

  const altered = filing.slice();
  altered[0] = 0;
  assert.equal(verifyReceipt(signed, publicKey, altered), false);
});
