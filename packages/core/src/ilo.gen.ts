// Generated from standard/schemas/ilo.schema.json by `pnpm codegen`. Do not edit.

/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Hash".
 */
export type Hash = string;
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Id".
 */
export type Id = string;
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "IsoDate".
 */
export type IsoDate = string;
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Permille".
 */
export type Permille = number;
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Citation".
 */
export type Citation = NeutralCitation | ReportCitation;
/**
 * A verifiable datum the Notebook read from a source. Never a claim, never generated.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Extract".
 */
export type Extract = Extract1 & Extract2;
export type Extract1 =
  | {
      kind: "date";
      value: IsoDate;
      role: "impugned-order" | "offence" | "arrest" | "fir" | "chargesheet" | "bail-refused" | "custody-from" | "other";
    }
  | {
      kind: "party";
      value: Party;
    }
  | {
      kind: "statute";
      act: "IPC" | "BNS" | "CrPC" | "BNSS" | "IEA" | "BSA" | "Constitution" | "other";
      section: string;
    }
  | {
      kind: "case-number";
      value: string;
      court: string;
    }
  | {
      kind: "amount";
      rupees: number;
    }
  | {
      kind: "citation";
      raw: string;
      citation: Citation | null;
      pinpoint?: number;
      quote?: string;
      proposition?: string;
    };
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Outcome".
 */
export type Outcome = "pass" | "fail" | "unresolved";
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "PleadingState".
 */
export type PleadingState =
  | "intake"
  | "record"
  | "facts"
  | "limitation"
  | "authorities"
  | "grounds"
  | "compliance"
  | "declaration"
  | "filed"
  | "defects-notified"
  | "registered";
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "EventBody".
 */
export type EventBody =
  | {
      type: "matter.opened";
      matter: Matter;
    }
  | {
      type: "source.added";
      source: Source;
    }
  | {
      type: "text.recorded";
      layer: TextLayer;
    }
  | {
      type: "extract.recorded";
      extract: Extract;
    }
  | {
      type: "extract.checked";
      check: ExtractCheck;
    }
  | {
      type: "extract.reviewed";
      extract: Id;
      extractHash: Hash;
      confirm: boolean;
      note?: string;
    }
  | {
      type: "citation.verified";
      verification: CitationVerification;
    }
  | {
      type: "claim.proposed";
      claim: Claim;
    }
  | {
      type: "conference.opened";
      conference: Id;
      agenda: Id[];
    }
  | {
      type: "conference.decided";
      decision: ConferenceDecision;
    }
  | {
      type: "pleading.transitioned";
      from: PleadingState;
      to: PleadingState;
      guards: GuardResult[];
    }
  | {
      type: "pleading.declared";
      /**
       * The advocate's AI-use declaration (draft SC AI Regulations, Reg 43(3)).
       */
      statement: string;
    }
  | {
      type: "pleading.condonation-sought";
      reason: string;
    };

/**
 * Every record the workspace stores, verifies or exchanges. TypeScript types are generated from this file.
 */
export interface IndianLegalOntologyILO01 {
  [k: string]: unknown;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Actor".
 */
export interface Actor {
  kind: "lawyer" | "notebook" | "verifier" | "studio" | "moto" | "pleading" | "court" | "system";
  id: Id;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Matter".
 */
export interface Matter {
  id: Id;
  title: string;
  forum: "Supreme Court of India";
  caseType: "SLP(Crl)" | "SLP(C)";
  impugnedOrder: {
    court: string;
    caseNumber: string;
    date: IsoDate;
  };
  petitionerInCustody: boolean;
}
/**
 * Immutable bytes supplied by the lawyer or fetched from a court source.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Source".
 */
export interface Source {
  hash: Hash;
  title: string;
  mediaType: string;
  origin: "lawyer" | "court" | "corpus";
  role:
    | "impugned-order"
    | "annexure"
    | "fir"
    | "chargesheet"
    | "medical"
    | "custody-certificate"
    | "judgment"
    | "draft"
    | "other";
  certified?: boolean;
  url?: string;
}
/**
 * One OCR or text-extraction engine's reading of a line.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Reading".
 */
export interface Reading {
  engine: string;
  text: string;
  confidence: Permille;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Line".
 */
export interface Line {
  n: number;
  /**
   * Agreed text. Empty when engines disagree.
   */
  text: string;
  /**
   * @minItems 1
   */
  readings: [Reading, ...Reading[]];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "TextLayer".
 */
export interface TextLayer {
  source: Hash;
  pages: {
    n: number;
    lines: Line[];
  }[];
}
/**
 * Exact location of a quote in a source. Maps to a Web Annotation TextQuoteSelector.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Anchor".
 */
export interface Anchor {
  source: Hash;
  page: number;
  line: number;
  quote: string;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Party".
 */
export interface Party {
  name: string;
  role: "petitioner" | "respondent" | "appellant" | "accused" | "complainant" | "state" | "other";
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "NeutralCitation".
 */
export interface NeutralCitation {
  scheme: "INSC";
  year: number;
  number: number;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "ReportCitation".
 */
export interface ReportCitation {
  scheme: "SCC" | "SCR" | "AIR-SC";
  year: number;
  volume: number;
  page: number;
}
/**
 * The deterministic rule that produced an extract. No generative model ever appears here.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Extractor".
 */
export interface Extractor {
  rule: string;
  version: number;
}
export interface Extract2 {
  id: Id;
  anchor: Anchor;
  extractor: Extractor;
}
/**
 * An advisory probability from a decision model (Jev or Clef). Recorded, never a sole gate.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Score".
 */
export interface Score {
  model: "jev" | "clef" | "clef-flash" | "fixture";
  version: string;
  question: string;
  probability: Permille;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "ExtractCheck".
 */
export interface ExtractCheck {
  extract: Id;
  extractHash: Hash;
  check: "ocr-agreement" | "anchor" | "value-in-quote" | "record-crosscheck" | "second-opinion";
  outcome: Outcome;
  reason?: string;
  score?: Score;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Paragraph".
 */
export interface Paragraph {
  n: number;
  voice: "facts" | "submission" | "analysis" | "holding" | "order";
  text: string;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Judgment".
 */
export interface Judgment {
  id: Id;
  /**
   * @minItems 1
   */
  citations: [Citation, ...Citation[]];
  title: string;
  decided: IsoDate;
  benchStrength: number;
  judges: string[];
  paragraphs: Paragraph[];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Level".
 */
export interface Level {
  outcome: "verified" | "failed" | "unresolved" | "not_checked";
  reason?: string;
}
/**
 * The verdict on one existing citation, at three levels. Missing from a source is unresolved, never failed.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "CitationVerification".
 */
export interface CitationVerification {
  mention: Id;
  mentionHash: Hash;
  judgment?: Id;
  tier: "sc-official" | "corpus" | "indian-kanoon" | "none";
  snapshot: string;
  identity: Level;
  pinpoint: Level;
  support: Level;
  standing: Level;
  scores?: Score[];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Ref".
 */
export interface Ref {
  type: "extract" | "verification" | "claim";
  id: Id;
}
/**
 * A novel proposition or argument from the Research Studio or the MOTO engine. Grounded only in verified extracts, verifications and accepted claims.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Claim".
 */
export interface Claim {
  id: Id;
  kind: "question-of-law" | "ground" | "proposition" | "counter-argument";
  text: string;
  origin: "studio" | "moto" | "lawyer";
  groundedIn: Ref[];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "ConferenceDecision".
 */
export interface ConferenceDecision {
  conference: Id;
  claim: Id;
  claimHash: Hash;
  decision: "accept" | "reject" | "defer";
  rationale: string;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Defect".
 */
export interface Defect {
  code: string;
  rule: string;
  message: string;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "GuardResult".
 */
export interface GuardResult {
  guard: string;
  ok: boolean;
  defects?: Defect[];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "LedgerEvent".
 */
export interface LedgerEvent {
  seq: number;
  prev: Hash | null;
  at: string;
  actor: Actor;
  body: EventBody;
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "Receipt".
 */
export interface Receipt {
  matter: Id;
  document: Hash;
  ledgerHead: Hash;
  extracts: Hash[];
  verifications: Hash[];
}
/**
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "SignedReceipt".
 */
export interface SignedReceipt {
  receipt: Receipt;
  /**
   * Ed25519 public key, hex
   */
  publicKey: string;
  /**
   * Ed25519 signature over the canonical receipt, hex
   */
  signature: string;
}
/**
 * The simulated Supreme Court's evaluation agent grading a workspace export against its answer key.
 *
 * This interface was referenced by `IndianLegalOntologyILO01`'s JSON-Schema
 * via the `definition` "EvalReport".
 */
export interface EvalReport {
  matter: Id;
  suite: "notebook" | "citations" | "defects";
  metrics: {
    name: string;
    value: Permille;
    target: Permille;
  }[];
  pass: boolean;
}
