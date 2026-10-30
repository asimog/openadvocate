import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Ledger, type Actor, type Claim, type Judgment, type Ref } from '@vakilbench/core';
import { decideClaim, explore, fixtureModel, MOTO, openConference, proposeClaim, research, STUDIO, studioView } from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };
const custody: Ref = { type: 'extract', id: 'date:custody' };
const goodCase: Ref = { type: 'verification', id: 'citation:good' };
const overruled: Ref = { type: 'verification', id: 'citation:overruled' };
const verified = new Set(['date:custody', 'citation:good']);
const isGrounded = (ref: Ref) => verified.has(ref.id);

const claim = (id: string, origin: Claim['origin'], groundedIn: Ref[], kind: Claim['kind'] = 'ground'): Claim => ({
  id,
  kind,
  text: `${id} text`,
  origin,
  groundedIn,
});

const premises = [
  { ref: custody, text: 'In custody since 03.07.2024' },
  { ref: goodCase, text: 'Long incarceration violates Article 21' },
  { ref: overruled, text: 'Bail is the rule (overruled)' },
];

test('MOTO proposals grounded in unverified data never reach the inbox', async () => {
  const ledger = new Ledger();
  const model = fixtureModel([
    claim('m1', 'moto', [custody, goodCase]),
    claim('m2', 'moto', [overruled]),
    claim('m3', 'moto', []),
    claim('m4', 'moto', [{ type: 'extract', id: 'invented' }]),
  ]);
  const { proposed, dropped } = await explore(ledger, MOTO, model, { issue: 'bail', premises, existing: [] }, isGrounded);
  assert.deepEqual(proposed.map((c) => c.id), ['m1']);
  assert.deepEqual(
    dropped.map((d) => d.reason),
    ['grounded in unverified verification:citation:overruled', 'ungrounded', 'grounded in extract:invented, which was not in the prompt'],
  );
  assert.equal(ledger.bodies('claim.proposed').length, 1);
});

test('only the lawyer decides, and only on the conference agenda', () => {
  const ledger = new Ledger();
  const q = claim('q1', 'studio', [custody], 'question-of-law');
  proposeClaim(ledger, STUDIO, q);
  assert.throws(() => decideClaim(ledger, lawyer, 'c1', q, 'accept', 'sound'), /not on the agenda/);
  assert.throws(() => openConference(ledger, MOTO, 'c1', ['q1']), /moto may not write/);
  openConference(ledger, lawyer, 'c1', ['q1']);
  decideClaim(ledger, lawyer, 'c1', q, 'accept', 'Custody period is undisputed');
  assert.equal(studioView(ledger.events, isGrounded)[0]?.status, 'accepted');
});

test('an accepted claim becomes blocked when its grounding fails later, and so do claims built on it', () => {
  const ledger = new Ledger();
  const g = claim('g1', 'studio', [custody, goodCase]);
  const dependent = claim('g2', 'moto', [{ type: 'claim', id: 'g1' }]);
  proposeClaim(ledger, STUDIO, g);
  proposeClaim(ledger, MOTO, dependent);
  openConference(ledger, lawyer, 'c1', ['g1', 'g2']);
  decideClaim(ledger, lawyer, 'c1', g, 'accept', 'ok');
  decideClaim(ledger, lawyer, 'c1', dependent, 'accept', 'ok');
  assert.deepEqual(studioView(ledger.events, isGrounded).map((i) => i.status), ['accepted', 'accepted']);

  const afterFailure = (ref: Ref) => ref.id !== 'citation:good' && isGrounded(ref);
  const view = studioView(ledger.events, afterFailure);
  assert.deepEqual(view.map((i) => i.status), ['blocked', 'blocked']);
  assert.deepEqual(view[0]?.ungrounded, [goodCase]);
});

test('editing a claim voids its acceptance', () => {
  const ledger = new Ledger();
  const g = claim('g1', 'studio', [custody]);
  proposeClaim(ledger, STUDIO, g);
  openConference(ledger, lawyer, 'c1', ['g1']);
  decideClaim(ledger, lawyer, 'c1', g, 'accept', 'ok');
  proposeClaim(ledger, STUDIO, { ...g, text: 'reworded' });
  assert.equal(studioView(ledger.events, isGrounded)[0]?.status, 'proposed');
});

test('research returns only deciding paragraphs, best match first', () => {
  const judgment: Judgment = {
    id: 'j1',
    citations: [{ scheme: 'INSC', year: 2020, number: 1 }],
    title: 'A v. B [synthetic]',
    decided: '2020-01-01',
    benchStrength: 3,
    judges: ['X'],
    paragraphs: [
      { n: 1, voice: 'submission', text: 'Counsel urged that prolonged custody warrants bail.' },
      { n: 2, voice: 'holding', text: 'Prolonged custody without trial offends Article 21 and warrants bail.' },
      { n: 3, voice: 'analysis', text: 'Article 21 protects liberty.' },
    ],
  };
  const found = research('prolonged custody bail Article 21', [judgment]);
  assert.deepEqual(found.map((f) => f.paragraph.n), [2, 3]);
});
