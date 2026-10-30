import { useState, useSyncExternalStore } from 'react';
import { formatCitation, type CitationVerification, type Extract, type Level } from '@vakilbench/core';
import { citationPasses, type Session } from './session.ts';

const TABS = ['Documents', 'Notebook', 'Citations', 'Studio', 'Conference', 'SLP', 'Ledger'] as const;
type Tab = (typeof TABS)[number];

export function App({ session }: { session: Session }) {
  useSyncExternalStore(
    (notify) => session.ledger.subscribe(notify),
    () => session.version,
  );
  const [, rerender] = useState(0);
  const [tab, setTab] = useState<Tab>('Notebook');
  const act = (fn: () => unknown) => async () => {
    await fn();
    rerender((n) => n + 1);
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>R. Kumar v. State (NCT of Delhi)</h1>
          <p className="muted">SLP (Crl) against the Delhi High Court's order of 14 August 2026 refusing bail</p>
        </div>
        <span className="pill" data-testid="slp-state">
          SLP: {session.state()}
        </span>
      </header>
      <nav role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'Documents' && <Documents session={session} />}
        {tab === 'Notebook' && <Notebook session={session} act={act} />}
        {tab === 'Citations' && <Citations session={session} act={act} />}
        {tab === 'Studio' && <Studio session={session} act={act} />}
        {tab === 'Conference' && <Conference session={session} act={act} />}
        {tab === 'SLP' && <Slp session={session} act={act} />}
        {tab === 'Ledger' && <LedgerPanel session={session} />}
      </main>
    </div>
  );
}

type Act = (fn: () => unknown) => () => Promise<void>;

function Documents({ session }: { session: Session }) {
  const sources = session.ledger.bodies('source.added').map((b) => b.source);
  const [selected, setSelected] = useState(sources[0]?.hash);
  const layer = session.notebook().layers.find((l) => l.source === selected);
  return (
    <section className="split">
      <ul className="list" aria-label="Sources">
        {sources.map((s) => (
          <li key={s.hash}>
            <button aria-pressed={s.hash === selected} onClick={() => setSelected(s.hash)}>
              {s.title}
              <span className="muted"> {s.role}{s.certified ? ', certified' : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="doc" data-testid="document">
        {layer?.pages.map((page) => (
          <div key={page.n}>
            <h3>Page {page.n}</h3>
            {page.lines.map((line) => (
              <div key={line.n} className={line.text ? 'line' : 'line disagree'} data-testid={line.text ? undefined : 'ocr-disagreement'}>
                <span className="ln">{line.n}</span>
                {line.text || line.readings.map((r) => `${r.engine}: “${r.text}”`).join('  ≠  ')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function Notebook({ session, act }: { session: Session; act: Act }) {
  const { items } = session.notebook();
  return (
    <section>
      <p className="muted">
        Read from the record by deterministic rules. No generative model. Each item is checked against its source line, both OCR readings, the court's case
        record and a second reader.
      </p>
      <table>
        <thead>
          <tr>
            <th>Kind</th>
            <th>Value</th>
            <th>Source line</th>
            <th>Checks</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.extract.id} data-testid="extract" data-kind={i.extract.kind} data-status={i.status}>
              <td>{i.extract.kind}</td>
              <td>{valueOf(i.extract)}</td>
              <td className="quote">“{i.extract.anchor.quote}”</td>
              <td>
                {i.checks.map((c) => (
                  <span key={c.check} className={`chip ${c.outcome}`} title={c.reason}>
                    {c.check}
                  </span>
                ))}
              </td>
              <td>
                <span className={`status ${i.status}`}>{i.status}</span>
              </td>
              <td className="actions">
                {i.status === 'checked' && (
                  <>
                    <button onClick={act(() => session.review(i.extract.id, true))}>Confirm</button>
                    <button onClick={act(() => session.review(i.extract.id, false))}>Reject</button>
                  </>
                )}
                {(i.status === 'failed' || i.status === 'unresolved') && (
                  <button data-testid="discard" onClick={act(() => session.review(i.extract.id, false))}>
                    Discard
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        data-testid="confirm-all"
        onClick={act(() => items.filter((i) => i.status === 'checked').forEach((i) => session.review(i.extract.id, true)))}
      >
        Confirm all checked
      </button>
    </section>
  );
}

function valueOf(e: Extract): string {
  switch (e.kind) {
    case 'party':
      return `${e.value.name} (${e.value.role})`;
    case 'statute':
      return `s.${e.section} ${e.act}`;
    case 'amount':
      return `₹${e.rupees}`;
    case 'citation':
      return e.raw;
    case 'date':
      return `${e.value} (${e.role})`;
    case 'case-number':
      return e.value;
  }
}

function Citations({ session, act }: { session: Session; act: Act }) {
  const verdicts = [...session.citations().values()];
  return (
    <section>
      <div className="toolbar">
        <button data-testid="verify-citations" onClick={act(() => session.verifyCitations())}>
          Verify citations
        </button>
        <button data-testid="capture-sc" disabled={session.scCaptured} onClick={act(() => session.captureFromSupremeCourt())}>
          Fetch from Supreme Court site (you solve the CAPTCHA)
        </button>
      </div>
      <div className="cards">
        {verdicts.map((v) => (
          <CitationCard key={v.mention} v={v} line={session.notebook().byId(v.mention)?.line ?? ''} />
        ))}
      </div>
    </section>
  );
}

function CitationCard({ v, line }: { v: CitationVerification; line: string }) {
  const level = (name: string, l: Level) => (
    <div className="level" data-level={name} data-outcome={l.outcome}>
      <b>{name}</b> <span className={`status ${l.outcome}`}>{l.outcome}</span> <span className="muted">{l.reason}</span>
    </div>
  );
  return (
    <article className={`card ${citationPasses(v) ? 'ok' : 'bad'}`} data-testid="citation" data-mention={v.mention}>
      <p className="quote">{line}</p>
      <p className="muted">
        Source tier: {v.tier} · snapshot {v.snapshot}
        {v.scores?.map((s) => ` · ${s.model} ${s.probability / 10}%`)}
      </p>
      {level('identity', v.identity)}
      {level('pinpoint', v.pinpoint)}
      {level('support', v.support)}
      {level('standing', v.standing)}
    </article>
  );
}

function Studio({ session, act }: { session: Session; act: Act }) {
  const [question, setQuestion] = useState('prolonged custody bail Article 21');
  const [findings, setFindings] = useState(() => session.research(question));
  const claims = session.claims();
  return (
    <section>
      <h2>Research</h2>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFindings(session.research(question));
        }}
      >
        <input aria-label="Research question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button>Search judgments</button>
      </form>
      <ol className="findings">
        {findings.map((f) => (
          <li key={`${f.judgment.id}-${f.paragraph.n}`}>
            <b>{f.judgment.title}</b>, {formatCitation(f.judgment.citations[0]!)}, para {f.paragraph.n} ({f.paragraph.voice}): {f.paragraph.text}
          </li>
        ))}
      </ol>
      <h2>Arguments</h2>
      <div className="toolbar">
        <button data-testid="run-studio" onClick={act(() => session.runStudio())}>
          Propose from verified record
        </button>
        <button data-testid="run-moto" onClick={act(() => session.runMoto())}>
          Expand with MOTO
        </button>
      </div>
      <ul className="list">
        {claims.map((i) => (
          <li key={i.claim.id} data-testid="claim" data-status={i.status} data-origin={i.claim.origin}>
            <span className={`status ${i.status}`}>{i.status}</span> <b>{i.claim.kind}</b> ({i.claim.origin}): {i.claim.text}
          </li>
        ))}
      </ul>
      {session.dropped.length > 0 && (
        <>
          <h3>Dropped by validation</h3>
          <ul className="list">
            {session.dropped.map((d, n) => (
              <li key={n} data-testid="dropped">
                {d.reason}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Conference({ session, act }: { session: Session; act: Act }) {
  const agenda = session.claims().filter((i) => i.status === 'proposed' || i.status === 'deferred');
  const [rationale, setRationale] = useState<Record<string, string>>({});
  return (
    <section>
      <p className="muted">You chair. Nothing generated enters the petition without your decision and a written reason.</p>
      {agenda.length === 0 && <p>No proposals waiting.</p>}
      {agenda.map((i) => (
        <article key={i.claim.id} className="card" data-testid="agenda-item">
          <p>
            <b>{i.claim.kind}</b> ({i.claim.origin}): {i.claim.text}
          </p>
          <p className="muted">Grounded in: {i.claim.groundedIn.map((r) => `${r.type} ${r.id}`).join(', ')}</p>
          <input
            aria-label="Rationale"
            placeholder="Your reason"
            value={rationale[i.claim.id] ?? ''}
            onChange={(e) => setRationale({ ...rationale, [i.claim.id]: e.target.value })}
          />
          {(['accept', 'reject', 'defer'] as const).map((d) => (
            <button key={d} disabled={!rationale[i.claim.id]} onClick={act(() => session.decide(i.claim, d, rationale[i.claim.id]!))}>
              {d}
            </button>
          ))}
        </article>
      ))}
    </section>
  );
}

function Slp({ session, act }: { session: Session; act: Act }) {
  const options = session.guards();
  const defects = session.defects();
  return (
    <section>
      <p className="muted">The petition is a procedure. Each step opens only when its rules pass.</p>
      <ol className="steps" data-testid="next-steps">
        {options.map((o) => (
          <li key={o.to}>
            <b>
              {session.state()} → {o.to}
            </b>
            {o.guards.map((g) => (
              <div key={g.guard} className="guard" data-testid="guard" data-guard={g.guard} data-ok={g.ok}>
                <span className={`status ${g.ok ? 'verified' : 'failed'}`}>{g.ok ? 'pass' : 'blocked'}</span> {g.guard}
                {g.defects?.map((d) => (
                  <div key={`${d.code}-${d.message}`} className="muted">
                    {d.code}: {d.message}
                  </div>
                ))}
              </div>
            ))}
          </li>
        ))}
      </ol>
      <div className="toolbar">
        <button data-testid="advance" onClick={act(() => session.advance())}>
          Advance
        </button>
        <button data-testid="declare" disabled={!!session.receipt} onClick={act(() => session.declare())}>
          Sign receipt and AI-use declaration
        </button>
        <button data-testid="file" disabled={!session.receipt} onClick={act(() => session.file())}>
          File with the Supreme Court (simulated)
        </button>
      </div>
      <h3>Defect check</h3>
      <ul className="list" data-testid="defects">
        {defects.length === 0 ? <li>No defects.</li> : defects.map((d) => <li key={`${d.code}-${d.message}`}>{d.code}: {d.message} ({d.rule})</li>)}
      </ul>
      {session.registry && (
        <p data-testid="registry">
          Registry: {'diary' in session.registry ? `accepted, diary ${session.registry.diary}` : `${session.registry.defects.length} defects notified`}
        </p>
      )}
    </section>
  );
}

function LedgerPanel({ session }: { session: Session }) {
  const chain = session.chain();
  return (
    <section>
      <p data-testid="chain">Chain: {chain.ok ? `intact, head ${chain.head?.slice(0, 12)}…` : `broken at ${chain.brokenAt}`}</p>
      <h3>Evaluation agent (simulated Supreme Court)</h3>
      <ul className="list">
        {session.evalReports().map((r) => (
          <li key={r.suite} data-testid="eval" data-suite={r.suite} data-pass={r.pass}>
            <b>{r.suite}</b> {r.pass ? 'pass' : 'fail'}: {r.metrics.map((m) => `${m.name} ${m.value / 10}% (target ${m.target / 10}%)`).join(', ')}
          </li>
        ))}
      </ul>
      <table>
        <tbody>
          {[...session.ledger.events].reverse().map((e) => (
            <tr key={e.seq}>
              <td>{e.seq}</td>
              <td>
                {e.actor.kind}:{e.actor.id}
              </td>
              <td>{e.body.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
