import assert from 'node:assert/strict';
import { test } from 'node:test';
import { newSigningKey, sha256, signReceipt, type Extract, type Matter, type Source } from '@vakilbench/core';
import { type PleadingContext } from '@vakilbench/pleading';
import { fileSLP } from '../src/registry.ts';

const orderHash = sha256('order');
const matter: Matter = {
  id: 'gm-01',
  title: 'R. Kumar v. State',
  forum: 'Supreme Court of India',
  caseType: 'SLP(Crl)',
  impugnedOrder: { court: 'High Court of Delhi', caseNumber: 'CRL.A. 1/2026', date: '2026-08-14' },
  petitionerInCustody: true,
};
const source: Source = {
  hash: orderHash,
  title: 'Impugned order',
  mediaType: 'application/pdf',
  origin: 'lawyer',
  role: 'impugned-order',
  certified: true,
};
const base = { anchor: { source: orderHash, page: 1, line: 1, quote: 'q' }, extractor: { rule: 'r', version: 1 } };
const date: Extract = { ...base, id: 'd1', kind: 'date', value: '2026-08-14', role: 'impugned-order' };
const party: Extract = { ...base, id: 'p1', kind: 'party', value: { name: 'R. Kumar', role: 'petitioner' } };

const context = (over: Partial<PleadingContext> = {}): PleadingContext => ({
  matter,
  sources: [source],
  extracts: [
    { extract: date, status: 'confirmed' },
    { extract: party, status: 'confirmed' },
  ],
  citations: [],
  claims: [
    { claim: { id: 'q1', kind: 'question-of-law', text: 't', origin: 'lawyer', groundedIn: [] }, status: 'accepted' },
    { claim: { id: 'g1', kind: 'ground', text: 't', origin: 'lawyer', groundedIn: [] }, status: 'accepted' },
  ],
  today: '2026-09-01',
  condonationSought: false,
  receiptSigned: true,
  aiDisclosure: true,
  ...over,
});

const document = new TextEncoder().encode('the petition');
const receipt = signReceipt(
  { matter: 'gm-01', document: sha256(document), ledgerHead: sha256('head'), extracts: [], verifications: [] },
  newSigningKey(),
);

test('the registry returns defects, then a deterministic diary after the cure', () => {
  const defective = fileSLP({ context: context({ claims: [] }), receipt, document });
  assert.ok('defects' in defective);
  assert.deepEqual(defective.defects.map((d) => d.code), ['SLP-004', 'SLP-005']);

  const cured = fileSLP({ context: context(), receipt, document });
  assert.deepEqual(cured, { diary: `D-2026-${sha256(document).slice(0, 6)}` });
  assert.deepEqual(fileSLP({ context: context(), receipt, document }), cured);
});

test('a tampered document byte gives REG-RECEIPT', () => {
  const tampered = document.slice();
  tampered[0] = tampered[0]! ^ 1;
  const result = fileSLP({ context: context(), receipt, document: tampered });
  assert.ok('defects' in result);
  assert.deepEqual(result.defects.map((d) => d.code), ['REG-RECEIPT']);
});

test('receipt and rule defects are reported together', () => {
  const tampered = document.slice();
  tampered[0] = tampered[0]! ^ 1;
  const result = fileSLP({ context: context({ aiDisclosure: false }), receipt, document: tampered });
  assert.ok('defects' in result);
  assert.deepEqual(result.defects.map((d) => d.code), ['REG-RECEIPT', 'SLP-008']);
});
