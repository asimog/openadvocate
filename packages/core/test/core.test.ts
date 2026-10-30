import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canonical,
  Ledger,
  newSigningKey,
  sha256,
  signReceipt,
  validate,
  verifyChain,
  verifyReceipt,
  type Actor,
  type Matter,
} from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };
const notebook: Actor = { kind: 'notebook', id: 'notebook' };
const moto: Actor = { kind: 'moto', id: 'moto' };

const matter: Matter = {
  id: 'gm-01',
  title: 'R. Kumar v. State',
  forum: 'Supreme Court of India',
  caseType: 'SLP(Crl)',
  impugnedOrder: { court: 'High Court of Delhi', caseNumber: 'BAIL APPLN. 1234/2026', date: '2026-08-14' },
  petitionerInCustody: true,
};

test('canonical JSON is key-order independent and integer-only', () => {
  assert.equal(canonical({ b: 1, a: [true, null] }), canonical({ a: [true, null], b: 1 }));
  assert.throws(() => canonical({ x: 0.5 }), /safe integers only/);
  assert.equal(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('schema rejects malformed records at the ledger boundary', () => {
  const ledger = new Ledger();
  assert.throws(
    () => ledger.append(lawyer, { type: 'matter.opened', matter: { ...matter, forum: 'Delhi HC' } as unknown as Matter }),
    /invalid LedgerEvent/,
  );
  assert.equal(ledger.events.length, 0);
});

test('extract without its kind discriminant is invalid', () => {
  const anchor = { source: 'a'.repeat(64), page: 1, line: 1, quote: 'x' };
  const extractor = { rule: 'date.v1', version: 1 };
  assert.deepEqual(validate('Extract', { id: 'e1', kind: 'date', value: '2024-06-28', role: 'offence', anchor, extractor }), []);
  assert.notDeepEqual(validate('Extract', { id: 'e1', value: '2024-06-28', role: 'offence', anchor, extractor }), []);
  assert.notDeepEqual(validate('Extract', { id: 'e1', kind: 'date', value: '2024-06-28', role: 'offence', anchor, extractor, invented: 1 }), []);
});

test('write ownership: only the notebook records extracts, MOTO cannot', () => {
  const ledger = new Ledger();
  ledger.append(lawyer, { type: 'matter.opened', matter });
  const extract = {
    id: 'e1',
    kind: 'date' as const,
    value: '2024-06-28',
    role: 'offence' as const,
    anchor: { source: 'a'.repeat(64), page: 1, line: 1, quote: '28.06.2024' },
    extractor: { rule: 'date.v1', version: 1 },
  };
  assert.throws(() => ledger.append(moto, { type: 'extract.recorded', extract }), /moto may not write extract.recorded/);
  ledger.append(notebook, { type: 'extract.recorded', extract });
  assert.equal(ledger.bodies('extract.recorded').length, 1);
});

test('ledger chain detects tampering', () => {
  const ledger = new Ledger();
  ledger.append(lawyer, { type: 'matter.opened', matter });
  ledger.append(lawyer, { type: 'conference.opened', conference: 'c1', agenda: [] });
  assert.equal(verifyChain(ledger.events).ok, true);
  const forged = structuredClone([...ledger.events]);
  forged[0]!.actor = { kind: 'lawyer', id: 'someone-else' };
  assert.deepEqual(verifyChain(forged), { ok: false, brokenAt: 1 });
});

test('receipt binds document bytes and signer', () => {
  const key = newSigningKey();
  const filing = new TextEncoder().encode('%PDF filing');
  const signed = signReceipt(
    { matter: 'gm-01', document: sha256(filing), ledgerHead: 'b'.repeat(64), extracts: [], verifications: [] },
    key,
  );
  assert.deepEqual(verifyReceipt(signed, { document: filing, publicKey: signed.publicKey }), { ok: true });
  const altered = filing.slice();
  altered[0] = 0;
  assert.deepEqual(verifyReceipt(signed, { document: altered }), { ok: false, reason: 'document bytes do not match' });
  assert.deepEqual(verifyReceipt(signed, { publicKey: 'c'.repeat(64) }), { ok: false, reason: 'signed by an unexpected key' });
});

test('citation grammar reads neutral and report citations in order', async () => {
  const { findCitations, parseCitation } = await import('../src/index.ts');
  const found = findCitations('See 2024 INSC 512, para 14, and (2019) 5 SCC 123; also AIR 1980 SC 1579.');
  assert.deepEqual(found.map((f) => f.citation.scheme), ['INSC', 'SCC', 'AIR-SC']);
  assert.deepEqual(parseCitation('2024 INSC 512'), { scheme: 'INSC', year: 2024, number: 512 });
  assert.equal(parseCitation('AIR 2024 SC whatever'), null);
});

test('canonical JSON refuses undefined inside arrays instead of emitting invalid JSON', () => {
  assert.throws(() => canonical([1, undefined]), /cannot encode undefined/);
  assert.equal(canonical({ a: 1, b: undefined }), '{"a":1}');
});

test('chain verification rejects an event forged under a disallowed actor', () => {
  const ledger = new Ledger();
  ledger.append(lawyer, { type: 'matter.opened', matter });
  const forged = structuredClone([...ledger.events]);
  forged[0]!.actor = moto;
  assert.deepEqual(verifyChain(forged), { ok: false, brokenAt: 0 });
});
