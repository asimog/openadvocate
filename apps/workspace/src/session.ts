import {
  fixtureDecider,
  hashOf,
  Ledger,
  newSigningKey,
  sha256,
  signReceipt,
  verifyChain,
  type Actor,
  type Claim,
  type ConferenceDecision,
  type EvalReport,
  type Ref,
  type SignedReceipt,
} from '@vakilbench/core';
import { citationView, verifyAll, type CitationMention } from '@vakilbench/citations';
import { crosscheck, extractAll, NOTEBOOK, notebookView, recordText, review, secondOpinion } from '@vakilbench/notebook';
import { advance, checkDefects, currentState, evaluate as evaluateGuards, type PleadingContext } from '@vakilbench/pleading';
import {
  AUTOMATIC_TIERS,
  caseRecords,
  deciderAnswers,
  documents,
  evaluate,
  fileSLP,
  JUDGMENTS,
  matter,
  simulatedReader,
  TODAY,
  withCapture,
} from '@vakilbench/sim-supreme-court';
import { decideClaim, explore, MOTO, openConference, research, STUDIO, studioView, type ArgumentModel, type Premise } from '@vakilbench/studio';

export const LAWYER: Actor = { kind: 'lawyer', id: 'aor' };

export class Session {
  readonly ledger = new Ledger();
  readonly decider = fixtureDecider(deciderAnswers);
  readonly signingKey = newSigningKey();
  scCaptured = false;
  condonationSought = false;
  aiDisclosure = false;
  receipt: SignedReceipt | undefined;
  registry: PleadingContext['registry'];
  dropped: { claim: unknown; reason: string }[] = [];
  #version = 0;

  constructor() {
    this.ledger.subscribe(() => this.#version++);
  }

  get version() {
    return this.#version;
  }

  #touch() {
    this.#version++;
  }

  async open(): Promise<void> {
    this.ledger.append(LAWYER, { type: 'matter.opened', matter });
    for (const doc of documents) this.ledger.append(LAWYER, { type: 'source.added', source: doc.source });
    for (const doc of documents) recordText(this.ledger, doc.source.hash, doc.engines);
    extractAll(this.ledger);
    crosscheck(this.ledger, caseRecords);
    await secondOpinion(this.ledger, simulatedReader(this.ledger.events));
  }

  notebook() {
    return notebookView(this.ledger.events);
  }

  citations() {
    return citationView(this.ledger.events);
  }

  review(extractId: string, confirm: boolean) {
    review(this.ledger, LAWYER, extractId, confirm);
  }

  mentions(): CitationMention[] {
    return this.notebook()
      .items.filter((i) => i.extract.kind === 'citation' && i.status !== 'failed' && i.status !== 'rejected')
      .map((i) => i.extract as CitationMention);
  }

  async verifyCitations(): Promise<void> {
    const tiers = this.scCaptured ? withCapture(AUTOMATIC_TIERS) : AUTOMATIC_TIERS;
    await verifyAll(this.ledger, this.mentions(), tiers, this.decider);
  }

  async captureFromSupremeCourt(): Promise<void> {
    this.scCaptured = true;
    await this.verifyCitations();
  }

  isGrounded = (ref: Ref): boolean => {
    if (ref.type === 'extract') {
      return this.notebook().byId(ref.id)?.status === 'confirmed';
    }
    if (ref.type === 'verification') {
      const v = this.citations().get(ref.id);
      return !!v && citationPasses(v);
    }
    return false;
  };

  claims() {
    return studioView(this.ledger.events, this.isGrounded);
  }

  research(question: string) {
    return research(question, JUDGMENTS);
  }

  premises(): Premise[] {
    const facts = this.notebook()
      .items.filter((i) => i.extract.kind === 'date' && i.status === 'confirmed')
      .map((i) => ({ ref: { type: 'extract' as const, id: i.extract.id }, text: i.line }));
    const authorities = [...this.citations().values()].map((v) => ({
      ref: { type: 'verification' as const, id: v.mention },
      text: this.notebook().byId(v.mention)?.line ?? v.mention,
    }));
    return [...facts, ...authorities];
  }

  async runStudio(): Promise<void> {
    await this.#explore(STUDIO);
  }

  async runMoto(): Promise<void> {
    await this.#explore(MOTO);
  }

  async #explore(actor: Actor) {
    const prompt = { issue: 'Regular bail after prolonged custody', premises: this.premises(), existing: this.claims().map((i) => i.claim) };
    const { dropped } = await explore(this.ledger, actor, demoModel, prompt, this.isGrounded);
    this.dropped = [...this.dropped, ...dropped];
    this.#touch();
  }

  #conference = 0;

  decide(claim: Claim, decision: ConferenceDecision['decision'], rationale: string) {
    const id = `conference-${++this.#conference}`;
    openConference(this.ledger, LAWYER, id, [claim.id]);
    decideClaim(this.ledger, LAWYER, id, claim, decision, rationale);
  }

  context(): PleadingContext {
    const sources = this.ledger.bodies('source.added').map((b) => b.source);
    return {
      matter,
      sources,
      extracts: this.notebook().items.map((i) => ({ extract: i.extract, status: i.status })),
      citations: [...this.citations().values()],
      claims: this.claims().map((i) => ({ claim: i.claim, status: i.status })),
      today: TODAY,
      condonationSought: this.condonationSought,
      receiptSigned: !!this.receipt,
      aiDisclosure: this.aiDisclosure,
      registry: this.registry,
    };
  }

  state() {
    return currentState(this.ledger.events);
  }

  guards() {
    return evaluateGuards(this.state(), this.context());
  }

  defects() {
    return checkDefects(this.context());
  }

  advance() {
    return advance(this.ledger, this.context());
  }

  filing(): Uint8Array {
    return new TextEncoder().encode(`SLP(Crl) ${matter.title} ledger ${this.ledger.head}`);
  }

  declare() {
    this.aiDisclosure = true;
    const items = this.notebook().items.filter((i) => i.status === 'confirmed');
    const verifications = [...this.citations().values()].filter(citationPasses);
    this.receipt = signReceipt(
      {
        matter: matter.id,
        document: sha256(this.filing()),
        ledgerHead: this.ledger.head!,
        extracts: items.map((i) => i.hash),
        verifications: verifications.map((v) => hashOf(v)),
      },
      this.signingKey,
    );
    this.#touch();
  }

  file() {
    if (!this.receipt) throw new Error('sign the receipt first');
    this.registry = fileSLP({ context: this.context(), receipt: this.receipt, document: this.filing() });
    this.#touch();
    return this.registry;
  }

  evalReports(): EvalReport[] {
    return [evaluate(this.ledger.events, 'notebook'), evaluate(this.ledger.events, 'citations')];
  }

  chain() {
    return verifyChain(this.ledger.events);
  }
}

export const citationPasses = (v: { identity: { outcome: string }; pinpoint: { outcome: string }; support: { outcome: string }; standing: { outcome: string } }) =>
  v.identity.outcome === 'verified' &&
  v.pinpoint.outcome !== 'failed' &&
  v.pinpoint.outcome !== 'unresolved' &&
  v.support.outcome !== 'failed' &&
  v.standing.outcome === 'verified';

// Stands in for an OpenRouter or local model in the demo: composes candidate arguments from the
// premises it is given, including ones built on failed authorities so the validation gate is visible.
const demoModel: ArgumentModel = {
  async generate(prompt, origin) {
    const fact = prompt.premises.find((p) => p.ref.type === 'extract');
    const authorities = prompt.premises.filter((p) => p.ref.type === 'verification');
    if (!fact || authorities.length === 0) return [];
    const make = (id: string, kind: Claim['kind'], text: string, groundedIn: Ref[]): Claim => ({ id: `${origin}-${id}`, kind, text, origin, groundedIn });
    if (origin === 'studio') {
      return [
        make('q1', 'question-of-law', 'Whether continued detention for over two years without trial violates Article 21 of the Constitution.', [fact.ref, authorities[0]!.ref]),
        make('g1', 'ground', 'Because the High Court failed to weigh the period of custody against the likely length of trial.', [fact.ref, authorities[0]!.ref]),
      ];
    }
    return authorities.slice(1).map((a, i) =>
      make(`a${i + 1}`, i % 2 ? 'counter-argument' : 'ground', `Alternative ground drawing on authority ${i + 1}: ${a.text.slice(0, 80)}`, [fact.ref, a.ref]),
    );
  },
};
