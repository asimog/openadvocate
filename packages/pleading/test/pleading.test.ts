import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hashOf, Ledger, sha256, type CitationVerification,
  type EventBody, type Extract, type Level, type Matter, type Source } from '@vakilbench/core';
import {
  PLEADING,
  SC_SLP_RULES,
  advance,
  advanceAll,
  checkDefects,
  currentState,
  evaluate,
  limitationDeadline,
  type PleadingContext,
} from '../src/index.ts';

const orderHash = sha256('order');
const matter: Matter = {
  id: 'gm-01',
  title: 'R. Kumar v. State',
  forum: 'Supreme Court of India',
  caseType: { scheme: 'sci-case-type', code: '2', label: 'SPECIAL LEAVE PETITION (CRIMINAL)' },
  impugnedOrder: { court: 'High Court of Delhi', caseType: 'CRL.A.', caseNumber: 'CRL.A. 1/2026', date: '2026-08-14' },
  petitionerInCustody: true,
};
const order: Source = {
  hash: orderHash,
  title: 'Impugned order',
  mediaType: 'application/pdf',
  origin: 'lawyer',
  role: 'impugned-order',
  certified: true,
};
const extractBase = { anchor: { source: orderHash, page: 1, line: 1, quote: 'q' }, extractor: { rule: 'r', version: 1 } };
const dateExtract: Extract = { ...extractBase, id: 'd1', kind: 'date', value: '2026-08-14', role: 'impugned-order' };
const partyExtract: Extract = { ...extractBase, id: 'p1', kind: 'party', value: { name: 'R. Kumar', role: 'petitioner' } };
const ok: Level = { outcome: 'verified' };
const citationExtract = (id: string): Extract => ({ ...extractBase, id, kind: 'citation', raw: `${id} 2020 INSC 1`, citation: { scheme: 'INSC', year: 2020, number: 1 } });
const verification = (mention: string, over: Partial<CitationVerification> = {}): CitationVerification => ({
  mention,
  mentionHash: hashOf(citationExtract(mention)),
  tier: 'sc-official',
  snapshot: 's1',
  identity: ok,
  pinpoint: ok,
  support: ok,
  standing: ok,
  ...over,
});

const context = (over: Partial<PleadingContext> = {}): PleadingContext => ({
  matter,
  sources: [order],
  extracts: [
    { extract: dateExtract, status: 'confirmed' },
    { extract: partyExtract, status: 'confirmed' },
    ...(over.citations ?? [verification('c1')]).map((v) => ({ extract: citationExtract(v.mention), status: 'confirmed' as const })),
  ],
  citations: [verification('c1')],
  claims: [
    { claim: { id: 'q1', kind: 'question-of-law', text: 't', origin: 'lawyer', groundedIn: [] }, status: 'accepted' },
    { claim: { id: 'g1', kind: 'ground', text: 't', origin: 'lawyer', groundedIn: [] }, status: 'accepted' },
  ],
  today: '2026-09-01',
  condonationSought: false,
  receiptSigned: false,
  aiDisclosure: true,
  ...over,
});

test('a passing context walks intake to declaration and records every guard result', () => {
  const ledger = new Ledger();
  assert.equal(advanceAll(ledger, context()), 'declaration');
  const moves = ledger.bodies('pleading.transitioned');
  assert.deepEqual(moves.map((m) => m.to), ['record', 'facts', 'limitation', 'authorities', 'grounds', 'compliance', 'declaration']);
  const facts = moves.find((m) => m.to === 'limitation')!;
  assert.deepEqual(facts.guards.map((g) => g.guard), ['dates-verified', 'parties-verified']);
  assert.ok(facts.guards.every((g) => g.ok));
});

test('signing the receipt files it and a registry diary registers it', () => {
  const ledger = new Ledger();
  advanceAll(ledger, context());
  assert.equal(advanceAll(ledger, context({ receiptSigned: true })), 'filed');
  assert.equal(advanceAll(ledger, context({ receiptSigned: true, registry: { diary: { number: 1, year: 2026 }, cnr: 'SCIN010000012026' } })), 'registered');
});

test('an unverified citation stops the walk at authorities and names the mention', () => {
  const ledger = new Ledger();
  const ctx = context({ citations: [verification('c1'), verification('c2', { standing: { outcome: 'failed' } })] });
  assert.equal(advanceAll(ledger, ctx), 'authorities');
  const [attempt] = evaluate('authorities', ctx);
  assert.equal(attempt!.ok, false);
  const defects = attempt!.guards.flatMap((g) => g.defects ?? []);
  assert.equal(defects.length, 1);
  assert.match(defects[0]!.message, /c2/);
});

test('pinpoint not_checked passes but unresolved identity does not', () => {
  const noPinpoint = context({ citations: [verification('c1', { pinpoint: { outcome: 'not_checked' } })] });
  assert.equal(evaluate('authorities', noPinpoint)[0]!.ok, true);
  const unresolved = context({ citations: [verification('c1', { identity: { outcome: 'unresolved' } })] });
  assert.equal(evaluate('authorities', unresolved)[0]!.ok, false);
});

test('an unresolved date blocks facts until the lawyer resolves or discards it', () => {
  const ctx = context();
  assert.equal(evaluate('facts', ctx)[0]!.ok, true);
  const d2 = { ...dateExtract, id: 'd2' };
  const withDate = (status: 'unresolved' | 'rejected') =>
    context({ extracts: [{ extract: dateExtract, status: 'confirmed' }, { extract: d2, status }, { extract: partyExtract, status: 'confirmed' }] });

  const [blocked] = evaluate('facts', withDate('unresolved'));
  assert.equal(blocked!.ok, false);
  assert.match(blocked!.guards.flatMap((g) => g.defects ?? [])[0]!.message, /d2/);
  assert.equal(evaluate('facts', withDate('rejected'))[0]!.ok, true);

  const onlyRejected = context({ extracts: [{ extract: dateExtract, status: 'rejected' }, { extract: partyExtract, status: 'confirmed' }] });
  assert.equal(evaluate('facts', onlyRejected)[0]!.ok, false);
});

test('limitation is 90 days from the order date', () => {
  assert.equal(limitationDeadline('2026-08-14'), '2026-11-12');
  assert.equal(limitationDeadline('2026-08-14', 30), '2026-09-13');
});

test('a late filing is stopped at limitation unless condonation is sought', () => {
  const late = context({ today: '2026-11-13' });
  assert.equal(advanceAll(new Ledger(), late), 'limitation');
  assert.equal(advanceAll(new Ledger(), { ...late, condonationSought: true }), 'declaration');
  assert.equal(evaluate('limitation', context({ today: '2026-11-12' }))[0]!.ok, true);
});

test('registry defects move filed to defects-notified and a cure returns to compliance', () => {
  const ledger = new Ledger();
  const filed = context({ receiptSigned: true });
  assert.equal(advanceAll(ledger, filed), 'filed');
  const notified = { ...filed, registry: { defects: [{ code: 'X', rule: 'r', message: 'm' }] } };
  assert.equal(advanceAll(ledger, notified), 'defects-notified');
  assert.equal(advanceAll(ledger, filed), 'filed');
});

test('a defect in the rules pack blocks compliance and every rule is unconfirmed with a reference', () => {
  const ctx = context({ aiDisclosure: false });
  assert.deepEqual(checkDefects(ctx).map((d) => d.code), ['SLP-008']);
  assert.equal(advanceAll(new Ledger(), ctx), 'compliance');
  assert.deepEqual(checkDefects(context({ claims: [] })).map((d) => d.code), ['SLP-004', 'SLP-005']);
  assert.ok(SC_SLP_RULES.every((r) => !r.confirmed && r.rule.length > 0));
});

test('currentState is intake for an empty ledger', () => {
  assert.equal(currentState(new Ledger().events), 'intake');
  assert.equal(advance(new Ledger(), context({ matter: undefined })), null);
});

test('only the pleading actor may write pleading.transitioned', () => {
  const body: EventBody = { type: 'pleading.transitioned', from: 'intake', to: 'record', guards: [] };
  const ledger = new Ledger();
  assert.throws(() => ledger.append({ kind: 'lawyer', id: 'aor-1' }, body), /may not write/);
  assert.doesNotThrow(() => ledger.append(PLEADING, body));
});

test('a citation mention with no verdict, or a verdict on an older version, blocks authorities', () => {
  const unverified = context({ citations: [] , extracts: [{ extract: dateExtract, status: 'confirmed' }, { extract: partyExtract, status: 'confirmed' }, { extract: citationExtract('c9'), status: 'confirmed' }] });
  const [attempt] = evaluate('authorities', unverified);
  assert.equal(attempt!.ok, false);
  assert.match(attempt!.guards[0]!.defects![0]!.message, /c9: not verified/);

  const stale = context({ citations: [{ ...verification('c1'), mentionHash: sha256('older text') }] });
  assert.equal(evaluate('authorities', stale)[0]!.ok, false);

  const discarded = context({ citations: [], extracts: [{ extract: dateExtract, status: 'confirmed' }, { extract: partyExtract, status: 'confirmed' }, { extract: citationExtract('c9'), status: 'rejected' }] });
  assert.equal(evaluate('authorities', discarded)[0]!.ok, true);
});

test('limitation runs from the confirmed order date in the record, not the intake date', () => {
  const lateIntake = { ...matter, impugnedOrder: { ...matter.impugnedOrder, date: '2026-12-01' } };
  const past = context({ matter: lateIntake, today: '2027-01-01' });
  assert.equal(evaluate('limitation', past)[0]!.ok, false);
  const noRecordDate = context({ extracts: [{ extract: partyExtract, status: 'confirmed' }] });
  assert.match(evaluate('limitation', noRecordDate)[0]!.guards[0]!.defects![0]!.code, /G-ORDER-DATE/);
});
