import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertValid, fixtureDecider, hashOf, Ledger, parseCitation, sha256, type Actor, type Extract, type Judgment } from '@vakilbench/core';
import { citationView, verifyAll, type CitationMention } from '@vakilbench/citations';
import { crosscheck, extractAll, NOTEBOOK, notebookView, recordText } from '@vakilbench/notebook';
import {
  ANSWER_KEY,
  AUTOMATIC_TIERS,
  caseRecords,
  corpus,
  simulatedReader,
  documents,
  DRAFT_CITATIONS,
  evaluate,
  indianKanoon,
  JUDGMENTS,
  matter,
  PLANTED_LOCATIONS,
  scOfficial,
  SNAPSHOT,
  sourceOf,
  TIERS,
  TODAY,
  TREATMENTS,
  withCapture,
} from '../src/index.ts';

const lawyer: Actor = { kind: 'lawyer', id: 'aor-1' };

function openMatter(): Ledger {
  const ledger = new Ledger();
  ledger.append(lawyer, { type: 'matter.opened', matter });
  for (const d of documents) ledger.append(lawyer, { type: 'source.added', source: d.source });
  return ledger;
}

const draftSource = sourceOf('draft').source.hash;

// What the Notebook would record for the draft, built by hand so the verifier can be graded in isolation.
function handBuiltMentions(ledger: Ledger): CitationMention[] {
  return DRAFT_CITATIONS.map((d, i) => {
    const mention = {
      id: `cite-${d.label}`,
      kind: 'citation',
      raw: `${d.party}, ${d.cite}`,
      citation: parseCitation(d.cite),
      pinpoint: d.pinpoint,
      quote: d.quote,
      proposition: d.proposition,
      anchor: { source: draftSource, page: 1, line: i + 2, quote: `${d.party}, ${d.cite}` },
      extractor: { rule: 'citation.mention', version: 1 },
    } as CitationMention;
    ledger.append(NOTEBOOK, { type: 'extract.recorded', extract: mention });
    return mention;
  });
}

const decider = simulatedReader([]);

test('every corpus judgment is a valid synthetic Judgment with numbered paragraphs', () => {
  assert.equal(JUDGMENTS.length, 10);
  const seen = new Set<string>();
  for (const j of JUDGMENTS) {
    assertValid<Judgment>('Judgment', j);
    assert.ok(j.title.endsWith(' [synthetic]'), j.title);
    assert.ok(j.paragraphs.length >= 8 && j.paragraphs.length <= 20, `${j.id} has ${j.paragraphs.length} paragraphs`);
    assert.deepEqual(j.paragraphs.map((p) => p.n), j.paragraphs.map((_, i) => i + 1));
    assert.ok(j.paragraphs.some((p) => p.voice === 'holding') && j.paragraphs.at(-1)?.voice === 'order', j.id);
    assert.ok(j.citations.some((c) => c.scheme === 'INSC') && j.citations.some((c) => c.scheme === 'SCC'), j.id);
    for (const c of j.citations) {
      const key = JSON.stringify(c);
      assert.ok(!seen.has(key), `duplicate citation ${key}`);
      seen.add(key);
    }
  }
  for (const [treated, list] of Object.entries(TREATMENTS)) {
    const target = JUDGMENTS.find((j) => j.id === treated);
    assert.ok(target);
    for (const t of list) assert.ok(t.paragraph >= 1 && t.paragraph <= t.by.paragraphs.length);
  }
});

test('tiers: corpus stops at its snapshot, Kanoon is partial, sc-official is complete', () => {
  const recent = JUDGMENTS.find((j) => j.id === 'j-007')!;
  const [cite] = recent.citations;
  assert.ok(recent.decided > SNAPSHOT);
  assert.equal(corpus.find(cite).length, 0);
  assert.equal(indianKanoon.find(cite).length, 0);
  assert.equal(scOfficial.find(cite).length, 1);
  assert.ok(JUDGMENTS.every((j) => scOfficial.find(j.citations[0]).length === 1));
  assert.ok(JUDGMENTS.filter((j) => j.decided <= SNAPSHOT).every((j) => corpus.find(j.citations[1]!).length === 1));
  const kanoonCovered = JUDGMENTS.filter((j) => indianKanoon.find(j.citations[0]).length === 1).length;
  assert.ok(kanoonCovered > 0 && kanoonCovered < JUDGMENTS.length - 1);
  assert.deepEqual(TIERS.map((t) => t.tier), ['sc-official', 'corpus', 'indian-kanoon']);
  assert.deepEqual(AUTOMATIC_TIERS.map((t) => t.tier), ['corpus', 'indian-kanoon']);
  assert.deepEqual(withCapture(AUTOMATIC_TIERS).map((t) => t.tier), ['corpus', 'indian-kanoon', 'sc-official']);
});

test('a tier reports treatments only from judgments it holds', () => {
  const kavita = JUDGMENTS.find((j) => j.id === 'j-005')!;
  assert.equal(corpus.treatments(kavita.id).length, 1);
  assert.equal(indianKanoon.treatments(kavita.id).length, 0);
});

test('case records are found by court and case number, and only for the impugned order', () => {
  const rec = caseRecords.find('High Court of Delhi', 'BAIL APPLN. 1234/2026');
  assert.equal(rec?.firNumber, '210/2024');
  assert.deepEqual(rec?.orderDates, ['2026-08-14']);
  assert.equal(caseRecords.find('high court of delhi', 'bail appln.  1234/2026')?.caseNumber, 'BAIL APPLN. 1234/2026');
  assert.equal(caseRecords.find('High Court of Delhi', 'BAIL APPLN. 1243/2026'), undefined);
});

test('GM-01 documents are hashed from their text and carry the planted defects', () => {
  assert.equal(TODAY, '2026-10-30');
  assertValid('Matter', matter);
  assert.equal(documents.length, 4);
  for (const d of documents) {
    assertValid('Source', d.source);
    const text = d.engines[0]!.pages.map((p) => p.join('\n')).join('\n\n');
    assert.equal(d.source.hash, sha256(text));
    assert.deepEqual(d.engines.map((e) => e.engine), ['pdf-text', 'ocr-tesseract']);
  }
  assert.equal(sourceOf('draft').source.origin, 'lawyer');
  const fir = sourceOf('fir');
  const { line, page } = PLANTED_LOCATIONS.ocrDisagreement;
  assert.match(fir.engines[0]!.pages[page - 1]![line - 1]!, /28\.06\.2024/);
  assert.match(fir.engines[1]!.pages[page - 1]![line - 1]!, /28\.08\.2024/);
  const cert = sourceOf('custody-certificate');
  assert.match(cert.engines[0]!.pages[0]![PLANTED_LOCATIONS.wrongCaseNumber.line - 1]!, /1243\/2026/);
  assert.equal(DRAFT_CITATIONS.length, 7);
});

test('draft quotes sit in the paragraph the answer key expects', () => {
  const byId = new Map(JUDGMENTS.map((j) => [j.id, j]));
  for (const d of DRAFT_CITATIONS) {
    if (!d.judgment) continue;
    const hits = byId.get(d.judgment)!.paragraphs.filter((p) => p.text.includes(d.quote)).map((p) => p.n);
    assert.equal(hits.length, 1, `${d.label} quote must appear exactly once`);
    assert.equal(hits[0] === d.pinpoint, d.label !== 'b', d.label);
  }
});

test('verifier outcomes for each planted citation (a to g), with the capture tier', async () => {
  const ledger = openMatter();
  const mentions = handBuiltMentions(ledger);
  const results = await verifyAll(ledger, mentions, withCapture(AUTOMATIC_TIERS), decider);
  const by = Object.fromEntries(results.map((v, i) => [DRAFT_CITATIONS[i]!.label, v]));
  const outcomes = (l: string) => [by[l]!.identity, by[l]!.pinpoint, by[l]!.support, by[l]!.standing];

  assert.deepEqual(outcomes('a').map((x) => x.outcome), ['verified', 'verified', 'verified', 'verified']);
  assert.equal(by.a!.tier, 'corpus');
  assert.equal(by.a!.snapshot, SNAPSHOT);

  assert.deepEqual(by.b!.pinpoint, { outcome: 'failed', reason: 'quote_not_in_paragraph' });

  assert.deepEqual(by.c!.support, { outcome: 'failed', reason: 'cites_submission_as_holding' });
  assert.equal(by.c!.pinpoint.outcome, 'verified');

  assert.deepEqual(by.d!.standing, { outcome: 'failed', reason: 'overruled_by:j-004' });
  assert.equal(by.d!.identity.outcome, 'verified');

  assert.equal(by.e!.tier, 'sc-official');
  assert.equal(by.e!.judgment, 'j-007');
  assert.deepEqual(outcomes('e').map((x) => x.outcome), ['verified', 'verified', 'verified', 'verified']);

  assert.equal(by.f!.tier, 'none');
  assert.deepEqual(by.f!.identity, { outcome: 'unresolved', reason: 'not_in_any_source' });

  assert.deepEqual(by.g!.standing, { outcome: 'verified', reason: 'smaller_bench_overruling_ignored:j-006' });
  assert.equal(by.g!.support.outcome, 'verified');

  assert.equal(citationView(ledger.events).size, 7);
  const report = evaluate(ledger.events, 'citations');
  assert.equal(report.pass, true, JSON.stringify(report));
  assert.equal(report.suite, 'citations');
  assert.equal(report.metrics.find((m) => m.name === 'false-verified count')?.value, 0);
});

test('without capture, the recent judgment stays unresolved and the evaluator fails the run', async () => {
  const ledger = openMatter();
  const results = await verifyAll(ledger, handBuiltMentions(ledger), AUTOMATIC_TIERS, decider);
  const e = results[DRAFT_CITATIONS.findIndex((d) => d.label === 'e')]!;
  assert.deepEqual(e.identity, { outcome: 'unresolved', reason: 'not_in_any_source' });
  const report = evaluate(ledger.events, 'citations');
  assert.equal(report.pass, false);
  assert.ok(report.metrics.find((m) => m.name === 'identity accuracy')!.value < 1000);
});

test('with the sc-official tier first, every judgment resolves there', async () => {
  const ledger = openMatter();
  const results = await verifyAll(ledger, handBuiltMentions(ledger), TIERS, decider);
  const resolved = results.filter((v) => v.judgment);
  assert.equal(resolved.length, 6);
  assert.ok(resolved.every((v) => v.tier === 'sc-official'));
  assert.equal(evaluate(ledger.events, 'citations').pass, true);
});

test('without a decider, support cannot verify and the evaluator catches the mismatch', async () => {
  const ledger = openMatter();
  await verifyAll(ledger, handBuiltMentions(ledger), withCapture(AUTOMATIC_TIERS));
  const report = evaluate(ledger.events, 'citations');
  assert.equal(report.pass, false);
  assert.equal(report.metrics.find((m) => m.name === 'support accuracy')!.value < 1000, true);
  assert.equal(report.metrics.find((m) => m.name === 'false-verified count')!.value, 0);
});

test('a verifier that marks a bad citation verified is counted as a false verification', () => {
  const ledger = openMatter();
  const [bad] = handBuiltMentions(ledger).filter((m) => m.id === 'cite-d');
  ledger.append({ kind: 'verifier', id: 'citation-verifier' }, {
    type: 'citation.verified',
    verification: {
      mention: bad!.id,
      mentionHash: hashOf(bad),
      tier: 'corpus',
      snapshot: SNAPSHOT,
      identity: { outcome: 'verified' },
      pinpoint: { outcome: 'verified' },
      support: { outcome: 'verified' },
      standing: { outcome: 'verified' },
    },
  });
  const report = evaluate(ledger.events, 'citations');
  assert.equal(report.pass, false);
  assert.equal(report.metrics.find((m) => m.name === 'false-verified count')!.value, 1, 'only standing is falsely verified: the overruled paragraph does state the proposition');
});

test('a verification of an edited mention is ignored by the evaluator', async () => {
  const ledger = openMatter();
  const mentions = handBuiltMentions(ledger);
  await verifyAll(ledger, mentions, withCapture(AUTOMATIC_TIERS), decider);
  const first = mentions[0]!;
  ledger.append(NOTEBOOK, { type: 'extract.recorded', extract: { ...first, quote: 'edited quote' } as Extract });
  const report = evaluate(ledger.events, 'citations');
  assert.equal(report.pass, false);
});

test('full pipeline: Notebook reads GM-01, the verifier checks the draft, the evaluator grades both', async () => {
  const ledger = openMatter();
  for (const d of documents) recordText(ledger, d.source.hash, d.engines);
  extractAll(ledger);
  crosscheck(ledger, caseRecords);

  const items = notebookView(ledger.events).items;
  const mentions = items.flatMap((i) => (i.extract.kind === 'citation' ? [i.extract as CitationMention] : []));
  assert.equal(mentions.length, 7);

  const planted = (p: { source: string; page: number; line: number }) =>
    items.filter((i) => i.extract.anchor.source === p.source && i.extract.anchor.page === p.page && i.extract.anchor.line === p.line);
  for (const p of [PLANTED_LOCATIONS.ocrDisagreement, PLANTED_LOCATIONS.wrongCaseNumber]) {
    const there = planted(p);
    assert.ok(there.length > 0);
    assert.ok(there.every((i) => i.status === 'failed'), JSON.stringify(there.map((i) => i.status)));
  }

  await verifyAll(ledger, mentions, withCapture(AUTOMATIC_TIERS), decider);

  const notebook = evaluate(ledger.events, 'notebook');
  const citations = evaluate(ledger.events, 'citations');
  assert.equal(citations.pass, true, JSON.stringify(citations));
  assert.equal(notebook.pass, true, JSON.stringify(notebook));
  assert.deepEqual(
    notebook.metrics.map((m) => m.name),
    ['extract recall', 'extract precision', 'planted defect catch rate'],
  );
});

test('notebook suite: ideal extracts pass, missed or unflagged ones fail', () => {
  const src = 'b'.repeat(64);
  const anchor = (line: number) => ({ source: src, page: 1, line, quote: 'q' });
  const extractor = { rule: 'test', version: 1 };
  const ideal: Extract[] = ANSWER_KEY.extracts.map((x, i): Extract => {
    const id = `x${i}`;
    const a = anchor(i + 1);
    switch (x.kind) {
      case 'date':
        return { id, kind: 'date', value: x.value, role: x.role as 'fir', anchor: a, extractor };
      case 'party':
        return { id, kind: 'party', value: { name: x.name, role: 'other' }, anchor: a, extractor };
      case 'statute':
        return { id, kind: 'statute', act: x.act as 'IPC', section: x.section, anchor: a, extractor };
      case 'case-number':
        return { id, kind: 'case-number', value: x.value, court: 'High Court of Delhi', anchor: a, extractor };
      case 'citation':
        return { id, kind: 'citation', raw: x.cite, citation: null, anchor: a, extractor };
    }
  });
  const planted = (id: string, p: { source: string; page: number; line: number }): Extract => ({
    id,
    kind: 'case-number',
    value: 'BAIL APPLN. 1243/2026',
    court: 'x',
    anchor: { ...p, quote: 'q' },
    extractor,
  });

  const build = (extracts: Extract[], flag: (e: Extract) => boolean): Ledger => {
    const ledger = new Ledger();
    for (const extract of extracts) {
      ledger.append(NOTEBOOK, { type: 'extract.recorded', extract });
      for (const check of ['ocr-agreement', 'anchor', 'value-in-quote'] as const) {
        ledger.append(NOTEBOOK, {
          type: 'extract.checked',
          check: { extract: extract.id, extractHash: hashOf(extract), check, outcome: flag(extract) && check === 'anchor' ? 'fail' : 'pass' },
        });
      }
    }
    return ledger;
  };

  const bads = [planted('bad1', PLANTED_LOCATIONS.ocrDisagreement), planted('bad2', PLANTED_LOCATIONS.wrongCaseNumber)];
  const good = build([...ideal, ...bads], (e) => e.id.startsWith('bad'));
  const ok = evaluate(good.events, 'notebook');
  assert.equal(ok.pass, true, JSON.stringify(ok));
  assert.equal(ok.suite, 'notebook');
  assertValid('EvalReport', ok);

  const slipped = evaluate(build([...ideal, ...bads], (e) => e.id === 'bad1').events, 'notebook');
  assert.equal(slipped.pass, false);
  assert.equal(slipped.metrics.find((m) => m.name === 'planted defect catch rate')!.value, 500);

  const missed = evaluate(build(ideal.slice(1), () => false).events, 'notebook');
  assert.equal(missed.pass, false);
  assert.ok(missed.metrics.find((m) => m.name === 'extract recall')!.value < 1000);

  const noisy = evaluate(build([...ideal, { ...ideal[0]!, id: 'extra', value: '2000-01-01' } as Extract], () => false).events, 'notebook');
  assert.equal(noisy.pass, false);
  assert.ok(noisy.metrics.find((m) => m.name === 'extract precision')!.value < 1000);

  assert.equal(evaluate([], 'notebook').pass, false);
  assert.equal(evaluate([], 'citations').pass, false);
});

test('verifyAll picks up a newly reachable source tier and converges on rerun', async () => {
  const { Ledger } = await import('@vakilbench/core');
  const { verifyAll, citationView } = await import('@vakilbench/citations');
  const { AUTOMATIC_TIERS, withCapture, documents, matter } = await import('../src/index.ts');
  const { recordText, extractAll, notebookView } = await import('@vakilbench/notebook');
  const ledger = new Ledger();
  const lawyer = { kind: 'lawyer' as const, id: 'aor' };
  ledger.append(lawyer, { type: 'matter.opened', matter });
  for (const d of documents) ledger.append(lawyer, { type: 'source.added', source: d.source });
  for (const d of documents) recordText(ledger, d.source.hash, d.engines);
  extractAll(ledger);
  const mentions = notebookView(ledger.events).items.filter((i) => i.extract.kind === 'citation').map((i) => i.extract as never);
  const unresolved = () => [...citationView(ledger.events).values()].filter((v) => v.identity.outcome === 'unresolved').length;

  await verifyAll(ledger, mentions, AUTOMATIC_TIERS);
  assert.equal(unresolved(), 2);
  await verifyAll(ledger, mentions, withCapture(AUTOMATIC_TIERS));
  assert.equal(unresolved(), 1);
  const length = ledger.events.length;
  await verifyAll(ledger, mentions, withCapture(AUTOMATIC_TIERS));
  assert.equal(ledger.events.length, length);
});
