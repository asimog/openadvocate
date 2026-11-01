import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixtureDecider, Ledger, sha256, type Actor, type Extract, type Matter } from '@vakilbench/core';
import {
  crosscheck,
  extractAll,
  NOTEBOOK,
  notebookView,
  questionFor,
  recordText,
  review,
  secondOpinion,
  type CaseRecord,
} from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };
const source = sha256('impugned order');

const matter: Matter = {
  id: 'm1',
  title: 'Rahul Kumar v. State',
  forum: 'Supreme Court of India',
  caseType: { scheme: 'sci-case-type', code: '2', label: 'SPECIAL LEAVE PETITION (CRIMINAL)' },
  impugnedOrder: { court: 'High Court of Delhi', caseType: 'BAIL APPLN.', caseNumber: 'BAIL APPLN. 1234/2026', date: '2026-08-14' },
  petitionerInCustody: true,
};

const page1 = [
  'IN THE HIGH COURT OF DELHI AT NEW DELHI',
  'BAIL APPLN. 1234/2026',
  'RAHUL KUMAR ..........Petitioner(s)',
  'STATE OF NCT OF DELHI ..........Respondent',
  'FIR No. 210/2024 under Sections 307 and 34 IPC.',
  'The offence occurred on 28.06.2024.',
  'The petitioner was arrested on 5th July, 2024.',
  'The bail application was dismissed vide order dated 14-08-2026.',
  'Surety of Rs. 50,000/- and a fine of ₹ 1,00,000 were imposed under Section 439 Cr.P.C.',
  'Reliance is placed on Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273, para 14, "arrest is not to be made routinely".',
  'Dated 31.02.2024',
];

const record: CaseRecord = {
  court: 'High Court of Delhi',
  caseNumber: 'BAIL APPLN. 1234/2026',
  parties: [
    { name: 'Rahul Kumar', role: 'petitioner' },
    { name: 'State of NCT of Delhi', role: 'respondent' },
  ],
  orderDates: ['2026-08-14'],
  firNumber: 'FIR No. 210/2024',
};

const engines = (a: string[], b: string[] = a) => [
  { engine: 'pdf-text', pages: [a] },
  { engine: 'ocr', pages: [b], confidence: 800 },
];

function open(lines = page1, other = lines) {
  const ledger = new Ledger();
  ledger.append(lawyer, { type: 'matter.opened', matter });
  recordText(ledger, source, engines(lines, other));
  return ledger;
}

const find = (ledger: Ledger, kind: Extract['kind'], pick: (e: Extract) => boolean = () => true) => {
  const item = notebookView(ledger.events).items.find((i) => i.extract.kind === kind && pick(i.extract));
  assert.ok(item, `no ${kind} extract`);
  return item;
};

test('recordText keeps agreed text, blanks disagreement, and needs two engines', () => {
  const ledger = new Ledger();
  assert.throws(() => recordText(ledger, source, [{ engine: 'a', pages: [['x']] }]), /two engines/);
  const layer = recordText(ledger, source, engines(['Same  text', '28.06.2024'], ['same text', '28.08.2024']));
  assert.equal(layer.pages[0]!.lines[0]!.text, 'Same  text');
  assert.equal(layer.pages[0]!.lines[1]!.text, '');
  assert.equal(layer.pages[0]!.lines[1]!.readings[1]!.confidence, 800);
  assert.equal(ledger.bodies('text.recorded').length, 1);
});

test('extractors read each kind with exact quotes, roles and deterministic ids', () => {
  const ledger = open();
  const extracts = extractAll(ledger);
  const lineOf = (e: Extract) => page1[e.anchor.line - 1]!;
  for (const e of extracts) {
    assert.ok(lineOf(e).includes(e.anchor.quote), `${e.id} quote is a substring of its line`);
    assert.match(e.id, new RegExp(`^${e.kind}:${source.slice(0, 8)}:p1:l${e.anchor.line}:\\d+$`));
    assert.equal(e.extractor.version, 1);
  }
  const dates = extracts.flatMap((e) => (e.kind === 'date' ? [[e.value, e.role]] : []));
  assert.deepEqual(dates, [
    ['2024-06-28', 'offence'],
    ['2024-07-05', 'arrest'],
    ['2026-08-14', 'bail-refused'],
  ]);
  const parties = extracts.flatMap((e) => (e.kind === 'party' ? [e.value] : []));
  assert.deepEqual(parties, [
    { name: 'RAHUL KUMAR', role: 'petitioner' },
    { name: 'STATE OF NCT OF DELHI', role: 'state' },
  ]);
  const statutes = extracts.flatMap((e) => (e.kind === 'statute' ? [`${e.act} ${e.section}`] : []));
  assert.deepEqual(statutes, ['IPC 307', 'IPC 34', 'CrPC 439']);
  const cases = extracts.flatMap((e) => (e.kind === 'case-number' ? [[e.value, e.court]] : []));
  assert.deepEqual(cases, [
    ['BAIL APPLN. 1234/2026', 'unknown'],
    ['FIR No. 210/2024', 'unknown'],
  ]);
  assert.deepEqual(
    extracts.flatMap((e) => (e.kind === 'amount' ? [e.rupees] : [])),
    [50000, 100000],
  );
  const cite = extracts.find((e) => e.kind === 'citation');
  assert.ok(cite && cite.kind === 'citation');
  assert.equal(cite.raw, 'Arnesh Kumar v. State of Bihar, (2014) 8 SCC 273');
  assert.deepEqual(cite.citation, { scheme: 'SCC', year: 2014, volume: 8, page: 273 });
  assert.equal(cite.pinpoint, 14);
  assert.equal(cite.quote, 'arrest is not to be made routinely');
  assert.equal(cite.proposition, 'Reliance is placed on');
  assert.ok(!extracts.some((e) => e.kind === 'date' && e.value.startsWith('2024-02')), 'impossible date rejected');
});

test('clean text passes every deterministic check and is idempotent', () => {
  const ledger = open();
  extractAll(ledger);
  const { items } = notebookView(ledger.events);
  assert.ok(items.length > 10);
  for (const item of items) {
    assert.equal(item.status, 'checked', `${item.extract.id}: ${JSON.stringify(item.checks)}`);
    assert.deepEqual(item.checks.map((c) => c.check).sort(), ['anchor', 'ocr-agreement', 'value-in-quote']);
  }
  const count = ledger.events.length;
  extractAll(ledger);
  assert.equal(ledger.events.length, count);
});

test('a planted OCR disagreement is surfaced and never reaches checked', () => {
  const other = [...page1];
  other[5] = 'The offence occurred on 28.08.2024.';
  const ledger = open(page1, other);
  extractAll(ledger);
  const offence = find(ledger, 'date', (e) => e.kind === 'date' && e.role === 'offence');
  assert.equal(offence.extract.kind === 'date' && offence.extract.value, '2024-06-28');
  assert.equal(offence.status, 'failed');
  assert.equal(offence.line, 'The offence occurred on 28.06.2024.');
  assert.equal(offence.checks.find((c) => c.check === 'ocr-agreement')?.outcome, 'fail');
  assert.equal(offence.checks.find((c) => c.check === 'anchor')?.outcome, 'fail');
  assert.equal(find(ledger, 'date', (e) => e.kind === 'date' && e.role === 'arrest').status, 'checked');
});

test('a value that its own quote does not yield fails value-in-quote', () => {
  const ledger = open();
  const [real] = extractAll(ledger).filter((e) => e.kind === 'date');
  assert.ok(real && real.kind === 'date');
  ledger.append(NOTEBOOK, {
    type: 'extract.recorded',
    extract: { ...real, id: 'date:planted', value: '2024-06-29' },
  });
  extractAll(ledger);
  const planted = notebookView(ledger.events).byId('date:planted');
  assert.equal(planted?.status, 'failed');
  assert.equal(planted?.checks.find((c) => c.check === 'value-in-quote')?.outcome, 'fail');
  assert.equal(planted?.checks.find((c) => c.check === 'anchor')?.outcome, 'pass');
});

test('crosscheck compares parties, order dates and case numbers with the case record', () => {
  const lines = [...page1, 'AMIT SHARMA ..........Respondent', 'The bail application was rejected on 15.08.2026.'];
  const ledger = open(lines);
  extractAll(ledger);
  crosscheck(ledger, { find: (court, no) => (court === matter.impugnedOrder.court && no === matter.impugnedOrder.caseNumber ? record : undefined) });
  const outcome = (pick: (e: Extract) => boolean, kind: Extract['kind']) =>
    find(ledger, kind, pick).checks.find((c) => c.check === 'record-crosscheck');
  assert.equal(outcome((e) => e.kind === 'party' && e.value.name === 'RAHUL KUMAR', 'party')?.outcome, 'pass');
  assert.deepEqual(outcome((e) => e.kind === 'party' && e.value.name === 'AMIT SHARMA', 'party'), {
    extract: find(ledger, 'party', (e) => e.kind === 'party' && e.value.name === 'AMIT SHARMA').extract.id,
    extractHash: find(ledger, 'party', (e) => e.kind === 'party' && e.value.name === 'AMIT SHARMA').hash,
    check: 'record-crosscheck',
    outcome: 'fail',
    reason: 'not_in_case_record',
  });
  assert.equal(find(ledger, 'party', (e) => e.kind === 'party' && e.value.name === 'AMIT SHARMA').status, 'failed');
  assert.equal(outcome((e) => e.kind === 'date' && e.value === '2026-08-14', 'date')?.outcome, 'pass');
  assert.equal(outcome((e) => e.kind === 'date' && e.value === '2026-08-15', 'date')?.outcome, 'fail');
  assert.equal(outcome((e) => e.kind === 'case-number' && e.value.startsWith('BAIL'), 'case-number')?.outcome, 'pass');
  assert.equal(outcome((e) => e.kind === 'case-number' && e.value.startsWith('FIR'), 'case-number')?.outcome, 'pass');
  assert.equal(outcome((e) => e.kind === 'date' && e.role === 'offence', 'date'), undefined, 'offence dates get no crosscheck');
  assert.equal(outcome(() => true, 'amount'), undefined);
});

test('crosscheck without a case record is unresolved, and a record found later supersedes it', () => {
  const ledger = open();
  extractAll(ledger);
  crosscheck(ledger, { find: () => undefined });
  const rahul = () => find(ledger, 'party', (e) => e.kind === 'party' && e.value.name === 'RAHUL KUMAR');
  assert.equal(rahul().status, 'unresolved');
  assert.equal(rahul().checks.find((c) => c.check === 'record-crosscheck')?.reason, 'no_case_record');
  crosscheck(ledger, { find: () => record });
  assert.equal(rahul().status, 'checked');
});

test('second opinion routes the model score into pass, fail or unresolved', async () => {
  const ledger = open();
  extractAll(ledger);
  const items = notebookView(ledger.events).items;
  const pick = (kind: Extract['kind']) => items.find((i) => i.extract.kind === kind)!.extract;
  const answers = { [questionFor(pick('date'))]: 950, [questionFor(pick('amount'))]: 50, [questionFor(pick('statute'))]: 500 };
  await secondOpinion(ledger, fixtureDecider(answers, 950));
  const status = (kind: Extract['kind']) => notebookView(ledger.events).byId(pick(kind).id)!;
  assert.equal(status('date').checks.find((c) => c.check === 'second-opinion')?.outcome, 'pass');
  assert.equal(status('date').status, 'checked');
  const no = status('amount');
  assert.equal(no.status, 'failed');
  assert.equal(no.checks.find((c) => c.check === 'second-opinion')?.reason, 'model_disagrees');
  assert.equal(no.checks.find((c) => c.check === 'second-opinion')?.score?.probability, 50);
  const unsure = status('statute');
  assert.equal(unsure.status, 'unresolved');
  assert.equal(unsure.checks.find((c) => c.check === 'second-opinion')?.reason, 'model_unsure');
  const count = ledger.events.length;
  await secondOpinion(ledger, fixtureDecider({}, 0));
  assert.equal(ledger.events.length, count, 'extracts with a second opinion are not asked again');
});

test('review binds to the current hash, and re-extracting a changed extract resets it', () => {
  const ledger = open();
  extractAll(ledger);
  const offence = () => find(ledger, 'date', (e) => e.kind === 'date' && e.role === 'offence');
  const { id } = offence().extract;
  review(ledger, lawyer, id, true, 'matches the FIR');
  assert.equal(offence().status, 'confirmed');
  review(ledger, lawyer, id, false);
  assert.equal(offence().status, 'rejected');
  review(ledger, lawyer, id, true);

  const edited = [...page1];
  edited[5] = 'The offence occurred on 29.06.2024.';
  recordText(ledger, source, engines(edited));
  extractAll(ledger);
  assert.equal(offence().extract.id, id);
  const redone = offence().extract;
  assert.equal(redone.kind === 'date' && redone.value, '2024-06-29');
  assert.equal(offence().status, 'checked', 'the old confirmation does not carry over');
  assert.equal(find(ledger, 'date', (e) => e.kind === 'date' && e.role === 'arrest').status, 'checked');

  const untouched = notebookView(ledger.events).byId(find(ledger, 'amount').extract.id);
  review(ledger, lawyer, untouched!.extract.id, true);
  assert.equal(notebookView(ledger.events).byId(untouched!.extract.id)?.status, 'confirmed');
  assert.throws(() => review(ledger, lawyer, 'nope', true), /no extract/);
});

test('a failed extract stays failed even after the lawyer confirms it', () => {
  const other = [...page1];
  other[5] = 'The offence occurred on 28.08.2024.';
  const ledger = open(page1, other);
  extractAll(ledger);
  const { id } = find(ledger, 'date', (e) => e.kind === 'date' && e.role === 'offence').extract;
  review(ledger, lawyer, id, true);
  assert.equal(notebookView(ledger.events).byId(id)?.status, 'failed');
});

test('only the notebook writes extracts: MOTO and the lawyer are refused by the ledger', () => {
  const ledger = open();
  const [extract] = extractAll(ledger);
  assert.ok(extract);
  for (const kind of ['moto', 'lawyer', 'studio', 'verifier'] as const) {
    assert.throws(
      () => ledger.append({ kind, id: kind }, { type: 'extract.recorded', extract }),
      /may not write extract\.recorded/,
    );
  }
  assert.throws(
    () => ledger.append({ kind: 'moto', id: 'moto' }, { type: 'extract.reviewed', extract: extract.id, extractHash: 'a'.repeat(64), confirm: true }),
    /may not write extract\.reviewed/,
  );
});

test('a lawyer can discard a failed extract but never confirm it', async () => {
  const { Ledger } = await import('@vakilbench/core');
  const { NOTEBOOK, review, notebookView } = await import('../src/index.ts');
  const ledger = new Ledger();
  const source = 'a'.repeat(64);
  ledger.append({ kind: 'lawyer', id: 'aor' }, { type: 'source.added', source: { hash: source, title: 'x', mediaType: 'text/plain', origin: 'lawyer', role: 'other' } });
  const extract = { id: 'd1', kind: 'date' as const, value: '2024-06-28', role: 'offence' as const, anchor: { source, page: 1, line: 1, quote: '28.08.2024' }, extractor: { rule: 'date.dmy', version: 1 } };
  ledger.append(NOTEBOOK, { type: 'extract.recorded', extract });
  const { hashOf } = await import('@vakilbench/core');
  ledger.append(NOTEBOOK, { type: 'extract.checked', check: { extract: 'd1', extractHash: hashOf(extract), check: 'anchor', outcome: 'fail', reason: 'quote_not_found' } });
  const lawyer = { kind: 'lawyer' as const, id: 'aor' };
  review(ledger, lawyer, 'd1', true);
  assert.equal(notebookView(ledger.events).byId('d1')?.status, 'failed');
  review(ledger, lawyer, 'd1', false);
  assert.equal(notebookView(ledger.events).byId('d1')?.status, 'rejected');
});

const extractsOf = (lines: string[]) => {
  const ledger = open(lines);
  const extracts = extractAll(ledger);
  for (const item of notebookView(ledger.events).items) {
    assert.equal(item.status, 'checked', `${item.extract.id}: ${JSON.stringify(item.checks)}`);
  }
  return extracts;
};

test('a case name starts after the sentence that precedes it', () => {
  const cite = extractsOf(['Bail may be granted under Section 439 CrPC. Harinder Singh v. State of Punjab, 2021 INSC 114, para 9']).find(
    (e) => e.kind === 'citation',
  );
  assert.ok(cite && cite.kind === 'citation');
  assert.equal(cite.raw, 'Harinder Singh v. State of Punjab, 2021 INSC 114');
  assert.equal(cite.proposition, 'Bail may be granted under Section 439 CrPC.');
  assert.equal(cite.pinpoint, 9);
});

test('a date takes its role from its own clause', () => {
  const dates = extractsOf(['The bail application was dismissed on 10.01.2024; he is in custody since 01.01.2023']).flatMap((e) =>
    e.kind === 'date' ? [[e.value, e.role]] : [],
  );
  assert.deepEqual(dates, [
    ['2024-01-10', 'bail-refused'],
    ['2023-01-01', 'custody-from'],
  ]);
});

test('lakh and crore amounts are read as integer rupees', () => {
  const amounts = extractsOf(['Rs. 1 lakh, Rs. 2 crore, Rs. 1.5 lakhs and ₹ 50,000/- were deposited.']).flatMap((e) =>
    e.kind === 'amount' ? [e.rupees] : [],
  );
  assert.deepEqual(amounts, [100000, 20000000, 150000, 50000]);
});

test('lettered section numbers keep their suffix', () => {
  const statutes = extractsOf(['Sections 498-A and 304-B IPC', 'Charged under Section 376DA IPC.']).flatMap((e) =>
    e.kind === 'statute' ? [`${e.act} ${e.section}`] : [],
  );
  assert.deepEqual(statutes, ['IPC 498-A', 'IPC 304-B', 'IPC 376DA']);
});
