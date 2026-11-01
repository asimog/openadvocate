import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Ledger, newSigningKey, sha256, signReceipt, type Actor, type Claim, type Source } from '@vakilbench/core';
import { matterContext } from '@vakilbench/matter';
import { crosscheck, extractAll, notebookView, recordText, review } from '@vakilbench/notebook';
import { advance, currentState } from '@vakilbench/pleading';
import { decideClaim, openConference, proposeClaim } from '@vakilbench/studio';
import { caseRecords, enrolAdvocate, fileSLP, matter, TODAY } from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor' };
const ORDER = ['Rakesh Kumar ...Petitioner', 'State (NCT of Delhi) ...Respondent', 'Order dated 14.08.2026.', 'The bail application is dismissed.'];

function readyToDeclare(ledger: Ledger) {
  const bytes = new TextEncoder().encode(ORDER.join('\n'));
  const source: Source = { hash: sha256(bytes), title: 'Impugned order', mediaType: 'application/pdf', origin: 'lawyer', role: 'impugned-order', certified: true };
  ledger.append(lawyer, { type: 'matter.opened', matter });
  ledger.append(lawyer, { type: 'source.added', source });
  recordText(ledger, source.hash, [{ engine: 'pdf-text', pages: [ORDER] }, { engine: 'ocr', pages: [ORDER] }]);
  extractAll(ledger);
  crosscheck(ledger, caseRecords);
  for (const item of notebookView(ledger.events).items) review(ledger, lawyer, item.extract.id, true);

  const date = notebookView(ledger.events).items.find((i) => i.extract.kind === 'date')!.extract.id;
  const claims: Claim[] = [
    { id: 'q1', kind: 'question-of-law', text: 'Whether prolonged custody warrants bail.', origin: 'lawyer', groundedIn: [{ type: 'extract', id: date }] },
    { id: 'g1', kind: 'ground', text: 'Because the High Court ignored custody.', origin: 'lawyer', groundedIn: [{ type: 'extract', id: date }] },
  ];
  openConference(ledger, lawyer, 'c1', claims.map((c) => c.id));
  for (const c of claims) {
    proposeClaim(ledger, lawyer, c);
    decideClaim(ledger, lawyer, 'c1', c, 'accept', 'On the record.');
  }
  ledger.append(lawyer, { type: 'pleading.declared', statement: 'Prepared with AI assistance; every fact and citation verified.' });
}

const ctx = (ledger: Ledger, receiptSigned = false) => matterContext(ledger.events, { today: TODAY, receiptSigned });
const step = (ledger: Ledger, receiptSigned = false) => {
  while (advance(ledger, ctx(ledger, receiptSigned)));
};

function signAndFile(ledger: Ledger, key = newSigningKey()) {
  const document = new TextEncoder().encode(`SLP ${ledger.head}`);
  const receipt = signReceipt({ matter: matter.id, document: sha256(document), ledgerHead: ledger.head!, extracts: [], verifications: [] }, key);
  return { receipt, document, key };
}

test('a petition signed at declaration is registered from the ledger alone', () => {
  const ledger = new Ledger();
  readyToDeclare(ledger);
  step(ledger);
  assert.equal(currentState(ledger.events), 'declaration');
  const { receipt, document } = signAndFile(ledger);
  enrolAdvocate(receipt.publicKey);
  step(ledger, true);
  assert.equal(currentState(ledger.events), 'filed');
  const result = fileSLP({ events: ledger.events, receipt, document }, TODAY);
  assert.ok('diary' in result, JSON.stringify(result));
  assert.match(result.cnr, /^SCIN01[0-9]{6}2026$/);
  assert.equal(result.cnr, `SCIN01${String(result.diary.number).padStart(6, '0')}${result.diary.year}`);
});

test('a receipt signed before the procedure reached declaration is refused', () => {
  const ledger = new Ledger();
  readyToDeclare(ledger);
  const { receipt, document } = signAndFile(ledger);
  enrolAdvocate(receipt.publicKey);
  const result = fileSLP({ events: ledger.events, receipt, document }, TODAY);
  assert.deepEqual('defects' in result && result.defects.map((d) => d.code), ['REG-PROCEDURE']);
});

test('tampered bytes, an unenrolled key and a forged ledger are each refused', () => {
  const ledger = new Ledger();
  readyToDeclare(ledger);
  step(ledger);
  const { receipt, document } = signAndFile(ledger);
  const code = (r: ReturnType<typeof fileSLP>) => ('defects' in r ? r.defects[0]!.code : 'diary');

  assert.equal(code(fileSLP({ events: ledger.events, receipt, document }, TODAY)), 'REG-KEY');
  enrolAdvocate(receipt.publicKey);

  const tampered = document.slice();
  tampered[0] = 0;
  assert.equal(code(fileSLP({ events: ledger.events, receipt, document: tampered }, TODAY)), 'REG-RECEIPT');

  const forged = structuredClone([...ledger.events]);
  forged[1]!.actor = { kind: 'moto', id: 'moto' };
  assert.equal(code(fileSLP({ events: forged, receipt, document }, TODAY)), 'REG-LEDGER');
});
