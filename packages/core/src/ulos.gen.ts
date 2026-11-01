// Generated from standard/schemas/ulos.schema.json by `pnpm codegen`. Do not edit.

/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Hash".
 */
export type Hash = string;
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Id".
 */
export type Id = string;
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "IsoDate".
 */
export type IsoDate = string;
/**
 * eCourts Case Number Record: 16 characters, uppercase, no separators. Only the shape is checked. No check digit is documented, and the middle six digits mean different things at different courts (a diary number at SCI, a filing number at a High Court).
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Cnr".
 */
export type Cnr = string;
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "ExternalId".
 */
export type ExternalId =
  | {
      scheme: "ecourts-cnr";
      value: Cnr;
      role: "current" | "previous" | "impugned";
      /**
       * The string exactly as the portal showed it, e.g. DLHC01-014074-2018.
       */
      displayed?: string;
    }
  | {
      scheme: "sci-diary";
      number: number;
      year: number;
    }
  | {
      scheme: "sci-case";
      caseTypeCode: string;
      numberFrom: number;
      /**
       * SCI registers batches as ranges, e.g. SLP(C) No. 001359 - 001378. Equal to numberFrom for a single case.
       */
      numberTo: number;
      year: number;
    };
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Permille".
 */
export type Permille = number;
/**
 * eCourts Case Number Record: 16 characters, uppercase, no separators. Only the shape is checked. No check digit is documented, and the middle six digits mean different things at different courts (a diary number at SCI, a filing number at a High Court).
 */
export type Cnr1 = string;
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Citation".
 */
export type Citation = NeutralCitation | ReportCitation;
/**
 * A verifiable datum the Notebook read from a source. Never a claim, never generated.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
      legislation?: LegislationRef;
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Outcome".
 */
export type Outcome = "pass" | "fail" | "unresolved";
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
export interface UniformLegalOntologyStandardULOS01 {
  [k: string]: unknown;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Actor".
 */
export interface Actor {
  kind: "lawyer" | "notebook" | "verifier" | "studio" | "moto" | "pleading" | "court" | "system";
  id: Id;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Matter".
 */
export interface Matter {
  id: Id;
  title: string;
  forum: "Supreme Court of India";
  /**
   * The Supreme Court's own case-type code, from the sci.gov.in case_type list (research C6 §1d).
   */
  caseType: {
    scheme: "sci-case-type";
    code: string;
    label: string;
  };
  /**
   * SCI subject category. Codes were reused across schemes, so the scheme names the notice that defines it: F.No.11/Judl./2025, in force from 2025-04-21.
   */
  subjectCategory?: {
    scheme: "sci-subject-category-2025-04-21";
    code: string;
  };
  /**
   * SC e-filing (eFM 2.0/3.0) Special Category on the Case Detail tab. Default none.
   */
  specialCategory?: "none" | "death-penalty" | "habeas-corpus" | "demolition-of-property" | "eviction" | "bail";
  /**
   * Court-issued identifiers, kept as issued. A matter can carry several CNRs: a transfer issues a new one, and the SLP has its own.
   */
  externalIds?: ExternalId[];
  /**
   * The facts sci.gov.in uses to find a case by its lower-court order. The Notebook verifies them against the order's PDF.
   */
  impugnedOrder: {
    /**
     * SC e-filing Earlier Courts tab and sci.gov.in case-status-court (codes 4, 1, 3, 5).
     */
    courtType?: "supreme-court" | "high-court" | "district-court" | "state-agency-tribunal";
    court: string;
    /**
     * As the lower court writes it, e.g. BAIL APPLN.
     */
    caseType: string;
    /**
     * As displayed by the lower court.
     */
    caseNumber: string;
    date: IsoDate;
    cnr?: Cnr1;
  };
  petitionerInCustody: boolean;
}
/**
 * Immutable bytes supplied by the lawyer or fetched from a court source.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
    | "paper-book"
    | "draft"
    | "other";
  certified?: boolean;
  url?: string;
  /**
   * SCI 3-PDF paper book: Main, Additional, and ROP/OR (record of proceedings / office report). Cite the PDF page number at hearing.
   */
  paperBookPart?: "main" | "additional" | "rop-or";
}
/**
 * One OCR or text-extraction engine's reading of a line.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Reading".
 */
export interface Reading {
  engine: string;
  text: string;
  confidence: Permille;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Anchor".
 */
export interface Anchor {
  source: Hash;
  page: number;
  line: number;
  quote: string;
}
/**
 * ULOS-L. An Act, and optionally a section, as India Code (indiacode.gov.in, DSpace) identifies it. actId is dc.identifier.act_id and sectionId is dc.identifier.section_id. Handle URIs are not used as identity: some point at test hosts.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "LegislationRef".
 */
export interface LegislationRef {
  source: "indiacode";
  actId: string;
  actNumber?: string;
  actYear?: number;
  /**
   * dc.identifier.state_name; CENTRAL for Central Acts.
   */
  stateName?: string;
  sectionNumber?: string;
  sectionId?: string;
  /**
   * dc.identifier.repealed as India Code reported it at retrieval.
   */
  repealed?: boolean;
  retrieved?: IsoDate;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Party".
 */
export interface Party {
  name: string;
  role: "petitioner" | "respondent" | "appellant" | "accused" | "complainant" | "state" | "other";
}
/**
 * SCI neutral citation, e.g. 2023INSC1: year of pronouncement, INSC (India Supreme Court), serial number. Launched w.e.f. 2023-07-06; phase I covers judgments and orders from 2014-01-01. Printed with a QR code on the top left of the first page.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "NeutralCitation".
 */
export interface NeutralCitation {
  scheme: "INSC";
  year: number;
  number: number;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Score".
 */
export interface Score {
  model: "jev" | "clef" | "clef-flash" | "fixture";
  version: string;
  question: string;
  probability: Permille;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Paragraph".
 */
export interface Paragraph {
  n: number;
  voice: "facts" | "submission" | "analysis" | "holding" | "order";
  text: string;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Level".
 */
export interface Level {
  outcome: "verified" | "failed" | "unresolved" | "not_checked";
  reason?: string;
}
/**
 * The verdict on one existing citation, at three levels. Missing from a source is unresolved, never failed.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Ref".
 */
export interface Ref {
  type: "extract" | "verification" | "claim";
  id: Id;
}
/**
 * A novel proposition or argument from the Research Studio or the MOTO engine. Grounded only in verified extracts, verifications and accepted claims.
 *
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "Defect".
 */
export interface Defect {
  code: string;
  rule: string;
  message: string;
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
 * via the `definition` "GuardResult".
 */
export interface GuardResult {
  guard: string;
  ok: boolean;
  defects?: Defect[];
}
/**
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
 * This interface was referenced by `UniformLegalOntologyStandardULOS01`'s JSON-Schema
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
