# C5 — Master Standards and Ontology Plan

*Canonical document 5 of 5. Companions: `C1-literature-review.md` (evidence base), `C2-prior-art-repos-review.md` (repositories used), `C3-master-research-and-architecture.md` (architecture; authority for decisions D1–D35 and Stages 0–5 / P1–P4), `C4-master-product-plan.md` (Vakilbench MVP modules). Current to 30 October 2026.*

---

## 0. The plan in one page

The Indian Legal AI Commons (ILAC) is the open standards layer under Vakilbench, the Windows desktop workspace (D3). This document specifies what the Commons standardises, how, against which sources, and how it is offered to the Supreme Court.

1. **One contract layer: the Indian Legal Ontology (ILO).** Every object that crosses a module boundary, leaves a lawyer's machine, or is shown as a verdict is an ILO object. Each type has one normative **JSON Schema 2020-12** document; a **JSON-LD 1.1** context makes it linked data; provenance uses **PROV-O**; anchors use **W3C Web Annotation selectors**. TypeScript types, validators and agent write tools are generated from the schemas (D9).
2. **The ontology is built from Indian court data, not imported.** ILO's classes and properties are derived from the fields of the Supreme Court judgments dataset on AWS Open Data (parquet metadata: `title`, `petitioner`, `respondent`, `judge`, `author_judge`, `citation`, `case_id`, `cnr`, `decision_date`, `disposal_nature`, `nc_display`, `path` and the rest), from the High Court judgments dataset's metadata, and from scratch where the data carries nothing (typed statements, treatment, verification, origin). No external Indian legal ontology is a dependency (D29). Akoma Ntoso is an optional profile for statutes. The Law and Justice Wiki is a non-normative glossary.
3. **Three verification standards (D23).** **NVS** (Notebook Verification Standard) for facts extracted from matter documents; **CVS** (Citation Verification Standard) for authorities cited in drafts; **RTS** (Research and precedent Traceability Standard) for precedent edges and treatment. Each has schemas, deterministic blocking gates, an advisory scoring slot, a ledger-derived status and a conformance suite (CT-14, CT-04, CT-15).
4. **INSC first.** The Supreme Court neutral citation (`YYYY INSC n`) is the first identifier standard. The resolver order is fixed (D24): **T1 Supreme Court official (lawyer-operated capture in the built-in browser) → T2 AWS Open Data mirror → T3 Indian Kanoon via user-triggered webfetch or API**. There is **no CAPTCHA bypass** (D22). Missing from a corpus is never reported as fabricated.
5. **Verification record, AI-origin manifest and receipt.** The verification record keeps a technical axis (L1 identity, L2 pinpoint and quote) separate from a semantic axis (L3 support). The AI-origin manifest and verification receipt are **designed directly from the text of Reg 43(3)–(4)** and related provisions of the draft Regulations (draft dated 03.06.2026) (D31). The Annexure I format referred to in Reg 43(3) is not available; the design follows the regulation text and makes no claim about the annexure.
6. **Jev and Clef are advisory scorers (D16).** The System One decision models score extraction support, citation identity and support, and precedent treatment through typed question schemas defined here. Deterministic gates always run first and veto; model scores are recorded, used for routing into three bands (auto-pass / UNRESOLVED / fail), and never act as the sole gate.
7. **Separate eval verifier (D15).** Conformance to NVS, CVS and RTS is measured by an independent Verifier/Eval agent on held-out golden sets, using the CT suites. It cannot read generator scratch or builder fixtures. Its reports close Stages 2–5 (D34).
8. **Court proposal.** Through SCBA and SCAORA, the Commons asks the Court to define and own the minimum verification standard under Reg 3(1)(y), and offers this specification, an open SDK and a local CLI as input (§13).

---

## Reading conventions

| Label | Meaning |
|---|---|
| **[F]** | Fact from a primary source (file or page named). |
| **[S]** | Source-inspected: code, data or repository read directly. |
| **[I]** | Inference. |
| **[R]** | Normative requirement or recommendation of this specification. |
| **[U]** | Not yet confirmed; to be checked against data. |

"Draft Regulations" means the *[DRAFT] Regulations for Use of Artificial Intelligence in Courts, 2026*, circulated with the Supreme Court notice dated 03.06.2026. Regulation numbers are those of the draft and may change on notification. "MUST", "MUST NOT", "SHOULD" are normative. Namespace IRIs use the placeholder `https://spec.ilac.example/ilo/0.1/` until a neutral domain is registered.

---

## 1. Standards stack

### 1.1 The architectural rule

Every harness port (contract registry, ledger, document service, verification, tool gateway, context assembler; C3) is a conformance boundary [R]:

1. Every object carries `@context`, `@type`, `schemaVersion`, a ULID-based `id` and a content hash.
2. Each type has exactly one normative JSON Schema 2020-12 document at an immutable versioned URL. TypeScript types, validators, OpenAPI components and MCP tool definitions are generated from it.
3. The JSON-LD context maps every field to an IRI in `ilo:` or a reused W3C vocabulary (`prov:`, `oa:`, `dcterms:`, `skos:`, `xsd:`). Published contexts are immutable; a change is a new version path.
4. Cross-object rules (for example "a judicial finding is asserted by a bench, never a party") are expressed as validation rules run in CI and in the conformance suites; SHACL is the default rule language, with equivalent TypeScript validators generated for the hot path.
5. Hashes are SHA-256 over **RFC 8785 (JCS)** canonical JSON of the object minus `id` and any signature block, with a declared `hashProfile` (`ilo-jcs-sha256-v1`).
6. **Agents never write the record freely.** ILO schemas are compiled into the only write tools agents receive; agents submit RFC 6902 patch proposals; the owning service's kernel validates schema, role, invariants and commits with a ledger event in one transaction (propose → validate → commit, D10).

### 1.2 Format and protocol standards

| Standard | Role in ILO | Use |
|---|---|---|
| JSON Schema 2020-12 | Source of truth for every type | Adopt |
| JSON-LD 1.1 | Linked-data view of every object | Adopt; one protected context per version |
| W3C PROV-O | Provenance: Entity / Activity / Agent; ledger export | Adopt; `ModelInvocation`, `ToolInvocation`, `BrowserCapture` as Activity subclasses |
| W3C Web Annotation selectors | `TextQuoteSelector`, `TextPositionSelector`, `FragmentSelector`, `refinedBy` | Adopt and extend with `ParagraphSelector`, `PdfBoxSelector` |
| SKOS | Glossary concepts and controlled vocabularies (case types, disposal natures, treatment labels) | Adopt |
| RFC 8785 JCS + SHA-256 | Deterministic hashing | Adopt |
| RFC 6902 JSON Patch | Agent write proposals | Adopt |
| in-toto Statement v1 + DSSE | Signed manifest, receipt, run manifest, conformance report | Adopt |
| Ed25519 | Ledger checkpoints and DSSE signatures (local key, D18) | Adopt |
| OpenAPI 3.1 | Local HTTP surface of the SDK and resolver | Adopt (generated) |
| MCP | Agent tool adapter only; grants no authority | Adopt as adapter (generated) |
| Akoma Ntoso (FRBR levels, AKN URIs) | Statute and provision versions | **Optional profile** for `ilo-law`; not required for judgments |
| Law and Justice Wiki (DAKSH) | Concept labels and related terms | **Non-normative glossary**; carries no legal effect and never counts as support |

ILO uses FRBR's Work / Expression / Manifestation split for judgments because the data needs it (one judgment; an eSCR report and a court copy; specific PDF bytes), not as a dependency on any library.

### 1.3 What ILO defines because nothing exists

1. **Judgment, bench and party model** derived from SC and HC metadata (§3).
2. **Indian identifier normalisation**: INSC, SCR/eSCR locators, report citations as locators, CNR, diary numbers, case numbers with case-type codes, HC neutral citations (§4).
3. **Typed legal statements** with mandatory `assertedBy`, `evidencedBy`, `epistemicStatus`.
4. **Proposition-level precedent treatment** scoped to a passage, with bench-strength and date checks.
5. **Two-axis verification record** (technical L1/L2; semantic L3).
6. **AI-origin manifest and verification receipt** bound by hash to the submitted file.
7. **Anchored Notebook items** (NVS) and **traceable precedent edges** (RTS).
8. **Resolution and coverage records** (`ResolutionAttempt`, `Source`, `CoverageWindow`) so "not in my corpus" is never reported as "does not exist".
9. **Advisory score records** and **question schemas** for Jev/Clef (§9).
10. **Indian temporal-law events** (commencement by notification, state amendments, savings, IPC→BNS-type transitions).
11. **Read / Prepare / Commit permission grants** for agents and connectors.

---
## 2. The draft AI Regulations mapped to standard artefacts

### 2.1 Status

- **Draft, not notified.** The notice is dated 03.06.2026, prepared under the aegis of the Artificial Intelligence Committee, Supreme Court of India; every page is headed [DRAFT] [F]. Nothing in this specification describes the Regulations as in force.
- **Reg 3(1)(y)** holds the disclosure-and-verification sentence: GenAI-generated content shall not be "filed or produced before any Court, without mandatory disclosure of its origin and verification through a designated centralised mechanism, as may be decided by the Appropriate Authority" [F]. The operative obligation sits inside a definition and may move on notification [I].
- **"Appropriate Authority"** (Reg 3(1)(l)) is the Apex Body at the Supreme Court or the AI Committee of the High Court, Tribunal or Commission concerned [F]. The designated mechanism is that authority's decision; the Commons offers a specification only [I].
- **Reg 43(3)** requires the advocate to disclose the AI-assisted character of a submission by declaration or certificate; **Reg 43(4)** lets the Court require "the AI System used, the nature and extent of AI assistance provided, and the steps taken to verify the accuracy" [F]. The manifest and receipt (§7) are designed from these words. The annexure format the regulation refers to is not available, and the design does not depend on it.

### 2.2 Provision → artefact map

| Draft provision (summary) [F] | Technical need [I] | ILO artefact [R] | Stage |
|---|---|---|---|
| **3(1)(y)** disclosure of origin and verification through a designated mechanism | A defined minimum verification procedure, a disclosure object, an interface a mechanism can expose | `VerificationRecord` (§7.2), `AIOriginManifest` (§7.5), `VerificationReceipt` (§7.6), verification interface (§7.8) | 3 |
| **3(1)(z)** "hallucination": fabrication, misstatement or erroneous representation of facts, precedents, statutory provisions | A failure taxonomy that names these classes | `hallucinationClass` (§7.3) across CVS, NVS, RTS | 2–4 |
| **3(1)(q)** "Court process" includes research, drafting, translation, filing | Operation classes | `courtProcess` tag on every agent operation | 0 |
| **3(1)(w)** explainability without specialist knowledge | Plain-language rendering | Normative renderer with test vectors (§7.4) | 3 |
| **3(1)(zb)** human in the loop | Recorded human review with authority | `HumanReview`, `ApprovalRecord`; manifest `humanAttestation` | 2 |
| **3(1)(x), 3(1)(zh), 48(1), 48(3)** external systems, sensitive data, no transfer without authorisation, minimisation | Verification without uploading pleadings | Local-first profile and minimal-disclosure payload (§7.9) | 3 |
| **43(5)** disclosure of synthetic data | Flag and description | Manifest `syntheticData` | 3 |
| **7(2)** functioning, inputs and decision logic capable of being understood | Inspectable runs | `RunManifest`, `ContextManifest` | 0 |
| **8(1), 43(6)** responsibility rests with the human; AI character no defence | Human attests, tool does not | Manifest `humanAttestation`; receipt non-determination clause | 3 |
| **8(3)** AI output advisory; verification dispensed only for reasons recorded in writing | Recorded waivers | `VerificationWaiver` with written reasons | 3 |
| **14(1)** data accurate, representative, lawfully obtained | Source provenance | `Source`, `SourceProvenance`, `CoverageWindow` | 1 |
| **19(1)(d)** research, precedent retrieval, citation verification | The verification standard | CVS, RTS, resolver (§5) | 3–4 |
| **19(1)(a), (e)** defect identification in filings | Shared defect vocabulary | `ilo-filing` defect codes (defect checker, Stage 3) | 3 |
| **19(1)(h)** document authenticity with human review | Hash-bound sources | `Manifestation` = SHA-256 of bytes; `SourceCapture` | 1 |
| **20(1)(b)–(f)** no outcome by automated decision; no risk scoring or profiling of persons | Vocabulary must not offer such fields | ILO has no outcome-prediction, win-probability or person-profiling types; validators reject unknown predicate namespaces in Commons bundles | Standing |
| **20(1)(h)** no AI output as independent evidence without disclosure | Distinguish pleading from AI output tendered as evidence | Manifest `submissionRole`; `evidence` requires `aiGeneratedCharacter` | 3 |
| **23(e), 33(3)** harmonised approach; common standards | Court-adoptable standard | ILO spec, versioned, openly licensed | Standing |
| **33(3)(a), 35(3)** approval after impact assessment | Evidence for assessment | Signed `ConformanceReport` (§10.3) | Post-MVP |
| **33(6)** AI Committee may call for suggestions | Entry route | Court proposal (§13) | Now |
| **36** controlled environment testing | Offline test harness | CT suites and golden matters, fully offline | 5 |
| **38(2)** source and datasets not shared outside Court premises | Court runs the verifier itself | Open reference implementation runs air-gapped | Standing |
| **42** fall-back on AI failure | Manual path | Declaration-only manifest (§7.5) | 3 |
| **44** AI Content Verification Authority maintains verification standards, tools and protocols | A body that owns versions | Versioned spec designed for hand-over (§11); receipts name `standardVersion` | Standing |
| **46(9)** no exclusive IP over tools built on judicial data or public resources | Open licensing | Open code and spec | Standing |
| **47** DPDP Act 2023, IT Act 2000 | Personal data handling | Local-first, no telemetry, PII labels and egress rules (D32) | 0 |

---

## 3. The Indian Legal Ontology (ILO) v0.1

### 3.1 Method: data first

ILO is built bottom-up from the records Indian courts already publish [R]:

1. **Profile the data.** Open every parquet partition of the AWS Open Data Supreme Court set (`s3://indian-supreme-court-judgments/metadata/parquet/year=YYYY/`) and the High Court set (`indian-high-court-judgments`), record each field's fill rate, value shapes, distinct-value counts and anomalies per year and per court. Output: `corpus-profile-<date>.json` (Stage 1).
2. **Derive classes and properties from fields.** Each field becomes a typed ILO property with a declared source field, a normaliser and a validation rule (§3.3). Where the same concept appears in both datasets under different names, ILO names it once and records both source mappings.
3. **Derive controlled vocabularies from values.** Distinct values of `disposal_nature`, case-type prefixes, bench compositions and court codes are clustered, reviewed by an advocate, and published as SKOS concept schemes with the raw strings as `altLabel`s (§3.4).
4. **Define from scratch what the data lacks.** Paragraphs, anchors, typed statements, treatment, Notebook items, verification and origin have no source fields; they are defined by competency questions written with practitioners (§3.9).
5. **Validate against the data.** Every schema is tested by loading the full SC metadata set and a stratified HC sample; any field the loader cannot place is either mapped or recorded as `unmapped` in the profile.

No class is created because another ontology has it. A glossary term from the Law and Justice Wiki may suggest a label; it never creates a class.

### 3.2 Two-layer graph

| | **Reference layer** (public) | **Matter layer** (per matter, local) |
|---|---|---|
| Contents | Courts, benches, judges; judgment Works/Expressions/Manifestations keyed by INSC or case identity; paragraphs and quote hashes; statutes and provision versions; vocabularies; reviewed treatment assertions | Pleadings, evidence, Notebook items, typed statements, issues, chronology, drafts, verification records, manifests |
| Built from | SC and HC dataset metadata and PDFs, T1 captures, statute sources | Lawyer's documents, agent proposals, lawyer decisions |
| Who writes | Release pipeline; human-reviewed contributions | Agents propose; kernel validates; lawyer commits |
| Mutability | Versioned releases (`ref-2026.11`), immutable once published | Append-only ledger with bitemporal supersession |
| Agent rights | Read and link only | Propose patches |
| Location | Downloadable bundle, mirrored in the workspace | Only on the lawyer's machine (MVP) |

**Rules [R]:** (a) every matter-layer `cites` edge targets a reference-layer IRI or a `ResolutionAttempt` explaining why it could not; (b) a matter node never uses a reference IRI as its own `id`; (c) nothing flows from matter to reference automatically; a correction found in matter work becomes a public contribution containing only public material.

**Dependency and retraction (D11).** Statements, draft paragraphs, Notebook items, precedent edges and verification records carry `dependsOn`. When a dependency fails, is found overruled, is superseded or is withdrawn, the cascade engine raises a typed `CascadeFlag` `{id, target, cause, kind, raisedAt, resolvedBy?}` with `kind ∈ dependency_failed | dependency_overruled | dependency_superseded | dependency_withdrawn`. Export for filing is blocked while any dependant of the filed text is flagged. A flag closes only by re-verification or a signed `VerificationWaiver`. Tested by CT-10.

**Bitemporality.** Matter statements and authority assertions carry `validFrom`/`validTo` (true in the world) and `recordedAt`/`supersededAt` (believed by the system).

### 3.3 Field-to-ontology map: Supreme Court dataset

Field semantics below are from inspection of the dataset's pipeline code; each MUST be confirmed by the Stage 1 profiling job before ILO 0.1 is frozen [S; U on exact fill rates].

| Parquet field | Observed content | ILO property (class) | Normalisation and rule |
|---|---|---|---|
| `title` | Cause title as printed ("A v. B") | `ilo:causeTitle` (Judgment Work) | Unicode NFC; whitespace collapse; raw kept; split on " v. / vs. / versus" only into a parse hint, never replacing `petitioner`/`respondent` |
| `petitioner` | First-named petitioner/appellant string | `ilo:party` with `PartyRole{role: petitioner_side}` | Party string → `PartyName` with normalised form; "and others"/"& Ors." captured as `othersIndicated: true`; State/Union names mapped to `Organisation` via a curated table |
| `respondent` | First-named respondent string | `ilo:party` with `PartyRole{role: respondent_side}` | As above |
| `judge` | Bench members (coram) as a delimited string | `ilo:bench` → `Bench{members[], strength}` | Split, strip honorifics ("Hon'ble", "Justice", "J."), map to `Judge` IRIs from a judge registry seeded from distinct values; `strength = count(members)` |
| `author_judge` | Author of the opinion | `ilo:authoredBy` (Opinion) | Must be a member of `bench`; mismatch → profile anomaly, not silent fix |
| `citation` | eSCR/SCR citation string | `ReportCitation{reporter: SCR}` (Expression locator) | Parsed by the SCR grammar (§4.5) |
| `case_id` | Neutral-citation display text, not a case number | Input to `NeutralCitation` | Parsed by the INSC grammar (§4.2); disagreement with `nc_display` → `identifier_conflict` |
| `cnr` | Case Number Record where emitted | `CNR` identifier on Case | Shape check (16 characters: state, district/establishment, serial, year) [U: SC CNR shape]; absent ≠ invalid |
| `decision_date` | Date of judgment | `ilo:decisionDate` (Judgment Work) | ISO 8601; raw kept; must not post-date dataset snapshot |
| `disposal_nature` | Outcome label (e.g. allowed, dismissed, disposed of) | `ilo:disposalNature` → SKOS concept | Values clustered into `ilo-vocab/disposal` (§3.4); raw string kept as `altLabel` |
| `nc_display` | Compact neutral citation (e.g. `2009INSC834`) | `NeutralCitation.compact` | Primary T2 join key |
| `path` | SCR locator `YYYY_volume_startpage_endpage` (some prefixed `S_`) | `ReportCitation` locator + Manifestation path | Parsed into year, volume, pages; `S_` prefix recorded as `supplementVolume` [U: meaning to confirm] |
| Language / file fields (PDF path per language) | English PDF; regional-language versions where present | `Expression{language}` + `Manifestation` | English is the MVP Expression; translations are separate Expressions, post-MVP |
| Any other field found by profiling | — | Mapped or listed as `unmapped` in the profile | No field dropped silently |

**Derived, not stored in the dataset:** `bench.strength`, the judge registry, `court = ilo:court/in/sc`, Expression and Manifestation identities (from the PDF bytes), paragraph structure (from the PDF), and the `CoverageWindow` (from per-year counts).

### 3.4 Field-to-ontology map: High Court dataset

The High Court judgments set on AWS Open Data (`indian-high-court-judgments`, same maintainers) covers 25 High Courts. Its metadata MUST be profiled per court before mapping; fields are expected to follow eCourts judgment metadata (court and bench codes, CNR, case type and number, judge names, decision date, disposal) [U]. Mapping rules [R]:

- **Reuse SC properties wherever the concept is the same** (`decisionDate`, `bench`, `party`, `cnr`, `disposalNature`), with per-court source mappings.
- **Court and bench identity** from court codes: `ilo:court/in/hc/{courtCode}` and, where the data distinguishes them, `ilo:bench/in/hc/{courtCode}/{seat}` (e.g. principal seat and benches).
- **Case identity** where no neutral citation exists: `ilo:case/in/{court}/{caseTypeCode}/{number}/{year}/{decisionDate}`, with the court's own case-type code kept and mapped to a cross-court SKOS case-type scheme.
- **HC neutral citations**: a per-court pattern registry built from the dataset and PDF headers (§4.6).
- **Regional-language judgments** are separate Expressions and are post-MVP (P3).

The HC set is used in MVP for vocabulary building (case types, disposal labels, judge-name normalisation) and as a held-out shift slice for calibration (§9.6); HC resolution is P3.

### 3.5 Vocabularies built from the data

| Scheme | Built from | Review |
|---|---|---|
| `ilo-vocab/disposal` | Distinct `disposal_nature` values (SC + HC) clustered: allowed, partly allowed, dismissed, disposed of, withdrawn, remanded, set aside, modified, other | Advocate review; raw strings as `altLabel` |
| `ilo-vocab/case-type` | Case-type prefixes in case numbers and HC case-type codes (SLP(C), SLP(Crl), CA, Crl.A, WP(C), WP(Crl), TP, RP, Curative, MA …) | Advocate review; per-court codes `exactMatch` to cross-court concept |
| `ilo-vocab/party-role` | Petitioner/respondent sides plus roles in pleadings (appellant, accused, complainant, intervenor, State, Union) | Advocate review |
| `ilo-vocab/judge` | Distinct normalised judge names with tenure from appearance dates | Registry maintained in the reference layer |
| `ilo-vocab/treatment` | Defined (§6.3), not data-derived | Practitioner review |
| `ilo-vocab/defect` | SC Registry defect categories used by the defect checker | Practitioner review |
| `ilo-glossary` (non-normative) | Law and Justice Wiki titles, "Related Terms", statute references | Labels only; `dcterms:source` = page URL pinned by revision |

### 3.6 Modules and classes

| Module | Classes (v0.1) | MVP stage |
|---|---|---|
| `ilo-core` | `Court`, `Bench` (members, strength, date), `Judge`, `Registry`; `Agent` ⊃ `Person`, `Organisation`, `SoftwareAgent` | 0 |
| `ilo-identifier` | `NeutralCitation`, `ReportCitation`, `CNR`, `DiaryNumber`, `CaseNumber`, `HCNeutralCitation`, `IdentifierAssertion` | 0 (INSC, SCR); HC in P3 |
| `ilo-document` | `Work`, `Expression`, `Manifestation`; `Judgment`, `Opinion`, `Order`, `Pleading`, `Affidavit`, `Annexure`, `Exhibit`; `Paragraph`, `ReporterBlock` (headnote, "Case Law Referred") | 1 |
| `ilo-anchor` | `EvidenceReference`; `ParagraphSelector`, `PdfBoxSelector` + Web Annotation selectors; `QuoteNormalisationProfile` | 1 |
| `ilo-source` | `Source`, `SourceProvenance`, `CoverageWindow`, `Acquisition`, `SourceCapture`, `ResolutionAttempt` | 1 |
| `ilo-notebook` | `NotebookItem` (NVS), `CascadeFlag` | 2 |
| `ilo-statement` | `LegalStatement` ⊃ `Allegation`, `Admission`, `Denial`, `Submission`, `EvidenceStatement`, `JudicialObservation`, `JudicialFinding`, `LegalProposition` (ratio/obiter/unclassified), `OperativeDirection`; `Issue`, `Relief` | 2 |
| `ilo-verify` | `VerificationRecord`, `TechnicalCheck`, `SemanticAssessment`, `AdvisoryScore`, `HumanReview`, `VerificationWaiver`, `VerificationIncident` | 3 |
| `ilo-origin` | `AIOriginManifest`, `VerificationReceipt`, `RunManifest`, `ContextManifest` | 3 |
| `ilo-filing` | `Defect`, `DefectCode` | 3 |
| `ilo-authority` | `CitationOccurrence`, `TreatmentAssertion`, `PrecedentEdge` (RTS), `Bindingness` | 4 |
| `ilo-law` | `Enactment`, `Provision`, `ProvisionVersion`, `AmendmentEvent`, `CommencementEvent`, `RepealEvent`, `SavingProvision`, `StateAmendment`, `GazetteNotification` | 4 (IPC/BNS, CrPC/BNSS, Evidence Act/BSA first) |
| `ilo-argument` | `ArgumentCandidate` (MOTO output), `ConferenceRecord` (Case Conference) | 4–5 |
| `ilo-proceeding` | `Case`, `Proceeding` (SLP, appeal, writ, IA, review, curative, transfer), `Filing`, `Hearing`, `PartyRole`, `CounselRole` | 1 (minimal) |
| `ilo-permission` | `PermissionGrant`, `ActionClass` (`read`, `prepare`, `commit`), `ApprovalRecord`, `OutboxItem` | 0 |
| `ilo-agent` | `Operation` descriptors with `courtProcess` tag; `AgentManifest` | 0 |
| `ilo-eval` | `EvalRun`, `EvalReport`, `ConformanceReport` | 0 (skeleton), 2–5 |

### 3.7 Identifiers (summary)

| Object | Pattern | Example |
|---|---|---|
| SC judgment Work with INSC | `ilo:case/in/sc/insc/{year}/{n}` | `ilo:case/in/sc/insc/2023/1` |
| Judgment Work without neutral citation | `ilo:case/in/{court}/{caseTypeCode}/{number}/{year}/{decisionDate}` | `ilo:case/in/sc/slp-crl/1234/2019/2020-02-14` |
| Expression | Work + `/expr/{kind}/{key}` | `…/insc/2009/834/expr/scr/2009-9-572` |
| Manifestation | `sha256:{hex}` | `sha256:9f2c…` |
| Paragraph | Expression + `#para={n}` (court-printed) or `#para-derived={n}@{extractorVersion}` | `…/expr/scr/2009-9-572#para=18` |
| Statute provision (optional AKN profile) | `/akn/in/act/{year}/{no}/!main~sec_{n}@{date}` | `/akn/in/act/2023/45/!main~sec_103@2024-07-01` |
| Matter objects | `urn:ilo:{type}:{ulid}` | `urn:ilo:vr:01JE…` |

Vendor identifiers (SCC, AIR, Indian Kanoon document IDs) are `sameAs` locators, never keys.

### 3.8 Evidence reference, typed statement, JSON-LD context

**Evidence reference (the single anchor).** Every quotation, pinpoint, Notebook item and claim resolves to an `EvidenceReference`: a Work, the Expression and Manifestation actually checked, and a selector chain from coarse (paragraph) to fine (quote). Court-printed paragraph numbers are used where present (`scheme: court-printed`); otherwise derived numbers carry the extractor version (`scheme: derived`), so a derived number can never pass as the Court's. Reporter blocks (SCR headnote, "Case Law Referred") are `ReporterBlock`s outside the paragraph sequence; a `para=n` pinpoint cannot land in them [R].

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/EvidenceReference.json",
  "title": "EvidenceReference",
  "type": "object",
  "required": ["@type", "work", "manifestation", "selector", "quoteHash", "acquisition"],
  "properties": {
    "@type": { "const": "EvidenceReference" },
    "work": { "type": "string", "pattern": "^(ilo:case/in/|ilo:matter/)" },
    "expression": { "type": "string" },
    "manifestation": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "selector": { "$ref": "Selector.json" },
    "quote": { "type": "string", "maxLength": 4000 },
    "quoteHash": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$",
                   "description": "SHA-256 of the quote after ilo-quote-norm-0.1" },
    "normalisationProfile": { "const": "ilo-quote-norm-0.1" },
    "acquisition": { "$ref": "Acquisition.json" },
    "attribution": { "type": "string" }
  },
  "additionalProperties": false
}
```

```json
"selector": {
  "type": "ParagraphSelector", "value": "18", "scheme": "court-printed",
  "refinedBy": {
    "type": "FragmentSelector", "conformsTo": "http://tools.ietf.org/rfc/rfc3778", "value": "page=12",
    "refinedBy": { "type": "TextQuoteSelector",
      "exact": "the right to a speedy trial is implicit in Article 21",
      "prefix": "We are of the view that ", "suffix": " and any" } }
}
```

For matter documents, `work` is `ilo:matter/{matter}/doc/{id}` and the chain adds a `TextPositionSelector` (page and character span).

**Quote normalisation `ilo-quote-norm-0.1`** (normative, with test vectors): Unicode NFC; collapse whitespace; join line-break hyphenation when the joined token occurs elsewhere in the document; straighten curly quotes and apostrophes; expand ligatures; treat `…` and `...` as equal; strip and record bracketed editorial insertions (`[emphasis supplied]`, `[sic]`); ignore footnote markers; preserve case and digits. Ellipsis-split quotes are matched segment by segment, in order, within the cited paragraph.

**Typed legal statement.**

```json
{
  "@context": "https://spec.ilac.example/ilo/0.1/context.jsonld",
  "@type": "JudicialFinding",
  "id": "urn:ilo:finding:01JCXR3Q8W4T",
  "text": "The appellant was in custody for over four years without trial.",
  "assertedBy": { "@type": "Bench", "court": "ilo:court/in/sc", "strength": 2, "date": "2024-03-12" },
  "evidencedBy": ["urn:ilo:evref:01JCXR2B7K"],
  "epistemicStatus": "found_by_court",
  "classification": { "method": "model", "agent": "urn:ilo:agent:extractor@1.4.0" },
  "validFrom": "2024-03-12", "recordedAt": "2026-10-30T10:02:11+05:30",
  "dependsOn": ["urn:ilo:vr:01JCXR2Z0A"]
}
```

`epistemicStatus` is closed: `alleged`, `admitted`, `denied`, `submitted`, `found_by_court`, `observed_by_court`, `held`, `recorded_in_document`, `machine_derived`, `counsel_confirmed`. Schema conformance never upgrades authority; the source passage stays authoritative. Rule: a `JudicialFinding` is asserted by a `Court`/`Bench`, never a party.

**Temporal law (optional AKN profile).** `Enactment` and `Provision` are Works; `ProvisionVersion` is an Expression with `validFrom`/`validTo`, `jurisdiction` (Union or State) and a source (`GazetteNotification` or amending provision). Changes are events (`AmendmentEvent` with `substituted | inserted | omitted | renumbered`, `CommencementEvent`, `RepealEvent`, `SavingProvision`). Queries take a governing date chosen by a recorded rule (offence date for substantive criminal law; filing date for many procedural questions). First fixtures: IPC/BNS, CrPC/BNSS, Evidence Act/BSA around 1 July 2024, dates taken from the Gazette.

**JSON-LD context excerpt.**

```json
{
  "@context": {
    "@version": 1.1, "@protected": true,
    "ilo": "https://spec.ilac.example/ilo/0.1/",
    "prov": "http://www.w3.org/ns/prov#",
    "oa": "http://www.w3.org/ns/oa#",
    "dcterms": "http://purl.org/dc/terms/",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "id": "@id", "type": "@type",
    "EvidenceReference": "ilo:EvidenceReference",
    "NeutralCitation": "ilo:NeutralCitation",
    "VerificationRecord": "ilo:VerificationRecord",
    "TextQuoteSelector": "oa:TextQuoteSelector",
    "exact": "oa:exact", "prefix": "oa:prefix", "suffix": "oa:suffix",
    "refinedBy": { "@id": "oa:refinedBy", "@type": "@id" },
    "assertedBy": { "@id": "prov:wasAttributedTo", "@type": "@id" },
    "wasGeneratedBy": { "@id": "prov:wasGeneratedBy", "@type": "@id" },
    "evidencedBy": { "@id": "ilo:evidencedBy", "@type": "@id", "@container": "@set" },
    "dependsOn": { "@id": "ilo:dependsOn", "@type": "@id", "@container": "@set" },
    "causeTitle": "ilo:causeTitle",
    "decisionDate": { "@id": "ilo:decisionDate", "@type": "xsd:date" },
    "disposalNature": { "@id": "ilo:disposalNature", "@type": "@id" },
    "bench": { "@id": "ilo:bench", "@type": "@id" },
    "authoredBy": { "@id": "ilo:authoredBy", "@type": "@id" },
    "work": { "@id": "ilo:work", "@type": "@id" },
    "manifestation": { "@id": "ilo:manifestation", "@type": "@id" },
    "retrievedAt": { "@id": "prov:generatedAtTime", "@type": "xsd:dateTime" }
  }
}
```

### 3.9 Change process: competency questions first

Every ILO change is an **ILO-RFC** [R]: (1) competency questions written by practitioners, at least one co-signed by an AOR or advocate; (2) drafted fragment (schema, context, rules), which an LLM may draft and a human editor owns; (3) each CQ becomes a query test over fixtures and must pass; (4) data check: the fragment loads the SC metadata and HC sample without unmapped fields; (5) public review with decisions and approvers' affiliations recorded; (6) immutable release with migration notes. A relation or statement type whose inter-annotator agreement on the golden set falls below κ 0.6 is demoted to an extension term.

**Seed competency questions** (each a CT-11 test):

| # | Competency question | Module |
|---|---|---|
| CQ1 | Which Work does `2023 INSC 1` identify, and which Expressions do we hold for it? | identifier, document |
| CQ2 | What is the SCR equivalent of an INSC citation, and from which source was it taken? | identifier, source |
| CQ3 | Does paragraph 18 exist in the court-printed numbering, and on which page? | anchor |
| CQ4 | Does this quotation occur in the cited paragraph after normalisation; if not, where? | anchor, verify |
| CQ5 | Which bench decided this judgment, with what strength, and who authored it? | core |
| CQ6 | Which judgments by a given judge in a date range are in the reference layer? | core |
| CQ7 | Which later judgments cite this judgment, with which proposition-level treatment? | authority |
| CQ8 | For citation X in my draft, what was checked, against which source, when, with what outcome? | verify, origin |
| CQ9 | Which draft paragraphs depend on a citation now unresolved or failed? | matter layer |
| CQ10 | Which version of BNS s.103 / IPC s.302 governs an offence dated 30 June 2024? | law |
| CQ11 | Which allegations in the petition are admitted or denied in the counter-affidavit? | statement |
| CQ12 | Which Notebook items are machine-derived and not yet reviewed? | notebook, verify |
| CQ13 | Which sources' coverage windows exclude judgments from the last N months? | source |
| CQ14 | What did the model see when it drafted paragraph 7? | origin |
| CQ15 | Which AI systems assisted this filing, in what way, and what verification steps were taken? | origin |
| CQ16 | Which disposal-nature strings in the corpus map to "dismissed", and from which courts? | vocab |

---

## 4. Identifier specifications

### 4.1 Facts the INSC spec rests on

- The Supreme Court introduced neutral citations in 2023 in the form `YYYY INSC n` [F].
- INSC numbers are also displayed for older judgments on the eSCR portal; the dataset's `nc_display` carries compact forms such as `2009INSC834` [S]. These are treated as back-assigned by the Court; stability is checked by sampling against SC listings [U].
- In the SC parquet, `case_id` holds neutral-citation display text, `citation` the eSCR citation, `path` the SCR locator, `cnr` the CNR where emitted [S].
- The dataset is thin for the most recent years; implementations record a `CoverageWindow` per snapshot rather than assume an update cadence [S].

### 4.2 INSC lexical grammar

```
insc-citation = year 0*1sep "INSC" 0*1sep serial
year          = 4DIGIT        ; 1950 ≤ year ≤ current year
serial        = 1*5DIGIT      ; value ≥ 1; leading zeros allowed on input
sep           = 1*( SP / NBSP / "-" / "_" )
```

Accepted (case-insensitive `INSC`): `2023 INSC 1`, `2023INSC1`, `2023 insc 0001`, `2023-INSC-1`, trailing punctuation stripped. Bracketed years (`[2023] INSC 1`) accepted with `lexicalWarning: bracketed_year`. Rejected: missing or out-of-range year, serial 0, any other court code.

### 4.3 Canonical forms and equality

| Form | Value (23rd judgment of 2024) | Use |
|---|---|---|
| Display | `2024 INSC 23` | UI, documents, receipts |
| Compact | `2024INSC23` | Join with `nc_display`; filenames |
| ILO IRI | `ilo:case/in/sc/insc/2024/23` | Work identity |

Two citations are equal iff year and integer serial are equal. Normalisation is bit-reproducible (CT-02).

### 4.4 `NeutralCitation` schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/NeutralCitation.json",
  "type": "object",
  "required": ["@type", "scheme", "year", "serial", "display", "work"],
  "properties": {
    "@type": { "const": "NeutralCitation" },
    "scheme": { "const": "INSC" },
    "year": { "type": "integer", "minimum": 1950 },
    "serial": { "type": "integer", "minimum": 1 },
    "display": { "type": "string", "pattern": "^[0-9]{4} INSC [1-9][0-9]{0,4}$" },
    "compact": { "type": "string", "pattern": "^[0-9]{4}INSC[1-9][0-9]{0,4}$" },
    "work": { "type": "string", "pattern": "^ilo:case/in/sc/insc/[0-9]{4}/[1-9][0-9]{0,4}$" },
    "raw": { "type": "string" },
    "lexicalWarnings": { "type": "array", "items": { "enum": ["bracketed_year", "leading_zeros", "trailing_punctuation", "nonstandard_separator"] } },
    "assignment": { "enum": ["contemporaneous", "back_assigned", "unknown"] }
  },
  "additionalProperties": false
}
```

**Two identifiers before `verified`.** An INSC string resolving in one source is not enough for L1 `verified`. Two independent identifiers MUST agree on the same Work: INSC + SCR locator (`path`/`citation`), or INSC + (CNR and decision date), or INSC + (case number and decision date) from the official copy's first page. Disagreement gives `unresolved` with `identifier_conflict`, never a silent pick. Each pairing is an `IdentifierAssertion` with its `SourceProvenance`.

### 4.5 Report citations

| Pattern | Treatment |
|---|---|
| `[2019] 3 SCR 456`, eSCR strings | Parsed; resolved from dataset `citation`/`path`; open and checkable |
| `(2019) 5 SCC 123`, `2023 SCC OnLine SC 123`, `AIR 1973 SC 1461`, `Cri LJ` | Parallel locators; equivalence mined from citing text; page pinpoints reported `not_checkable_against_open_source` |

### 4.6 High Court and case identifiers

HC neutral citations follow a per-court pattern registry built from the HC dataset and judgment headers; formats vary by court (P3). Case numbers are `CaseNumber{court, caseTypeCode, number, year}` with the court's original case-type code and a mapping to `ilo-vocab/case-type`. CNR and SC diary numbers are identifiers on `Case`, not on the judgment Work.

---

## 5. INSC resolver protocol (SC → AWS → Indian Kanoon)

### 5.1 Tiers and authority

| Tier | Source | Class | Establishes | Acquisition |
|---|---|---|---|---|
| **T1** | Supreme Court portals (neutral-citation listing, judgments by case number, eSCR) | `official` | L1 identity; L2 against the Court's own copy | `in_session_human`: the lawyer operates the portal in the built-in Chromium browser and solves any CAPTCHA; the harness captures the downloaded PDF, hashes it, records URL and time (`SourceCapture`) |
| **T2** | AWS Open Data SC judgments, mirrored locally | `open_mirror_of_official` (eSCR PDFs + parquet metadata) | L1 (with two-identifier rule); L2 against the eSCR Expression; fully offline | `mirror_lookup` |
| **T3** | Indian Kanoon | `aggregator` | Corroborates identity; may locate a judgment missing from T1/T2; L2 text marked aggregator | `user_webfetch` (one user-triggered page fetch in the built-in browser) or `official_api` with the user's key; no crawling |

**Authority levels [R].** `A` = T1 manifestation; `B` = T2; `C` = T3. Every technical outcome carries its level; the plain-language rendering and the receipt state it. A T3-only L2 match recommends a T1 acquisition before filing.

### 5.2 Order of operations

```
resolve(citation, pinpoint?, quote?, policy):
  0. parse + normalise. Parse failure → L1 failed, reason: unparseable
  1. reference-layer lookup: known Work IRI? held Manifestations?
  2. T2: query local mirror (DuckDB over parquet) on nc_display = compact
       → two-identifier check
       absent and year inside CoverageWindow → note not_found_in_source
       absent and year outside/near window edge → outside_corpus_coverage
  3. T1 if policy requires level A, or T2 did not resolve:
       open portal page in built-in browser → lawyer solves CAPTCHA if shown
       → lawyer selects judgment → download event → sha256(bytes), Manifestation,
         SourceCapture{gesture}, Acquisition{in_session_human}
       lawyer absent/declines → ResolutionAttempt{T1, skipped, user_absent|user_declined}
  4. T3 only if no Work resolved at T1/T2, or policy.corroborate:
       user-triggered webfetch or API; never automated multi-page fetching
  5. compute L1, then L2 (if pinpoint/quote) against the highest-tier Manifestation
  6. emit VerificationRecord listing every ResolutionAttempt in order
```

Policies: `filing` (default for export) runs T2 first for speed, then prompts a T1 acquisition for every authority quoted or pinpointed, so the final record is level A. `research` accepts levels B and C.

### 5.3 `ResolutionAttempt`

```json
{
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/ResolutionAttempt.json",
  "type": "object",
  "required": ["@type", "tier", "source", "startedAt", "outcome"],
  "properties": {
    "@type": { "const": "ResolutionAttempt" },
    "tier": { "enum": ["reference", "T1", "T2", "T3"] },
    "source": { "type": "string", "description": "e.g. src:sci-neutral-citation, src:aws-sc@2026-10-29, src:indiankanoon" },
    "acquisitionMode": { "enum": ["in_session_human", "mirror_lookup", "user_webfetch", "official_api", "local_cache"] },
    "startedAt": { "type": "string", "format": "date-time" },
    "outcome": { "enum": ["resolved", "not_found", "skipped", "error"] },
    "reason": { "enum": [
      "unparseable", "not_found_in_source", "outside_corpus_coverage", "source_unavailable",
      "captcha_required_user_absent", "user_declined", "rate_limited", "network_disabled",
      "identifier_conflict", "metadata_mismatch", "ambiguous_multiple_matches", "hash_mismatch",
      "not_checkable_against_open_source", "paragraph_scheme_absent", "ocr_quality_insufficient" ] },
    "manifestation": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "sourceCapture": { "type": "string" },
    "sourceSnapshot": { "type": "string" },
    "coverageWindow": { "$ref": "CoverageWindow.json" }
  }
}
```

### 5.4 `failed` versus `unresolved`

**`failed` asserts that an authoritative source contradicts the citation; `unresolved` asserts only that it could not be established.** Absence from a corpus is never contradiction.

| Situation | L1 | Reason |
|---|---|---|
| Not parseable as INSC | `failed` | `unparseable` |
| Resolves (two identifiers agree); parties/year/coram match | `verified` (A/B/C) | — |
| Resolves, but draft's parties or date belong to another judgment | `failed` | `metadata_mismatch` (`misattributed_authority`) |
| Not in T2; year inside window; T1 not attempted | `unresolved` | `not_found_in_source` |
| Not in T2; year outside or near window edge | `unresolved` | `outside_corpus_coverage` |
| T1 official listing for that year, confirmed complete by the lawyer, has no such serial | `failed` | `not_found_in_source` at T1 (`fabricated_authority`) |
| T1 needs CAPTCHA, no lawyer present | `unresolved` | `captcha_required_user_absent` |
| Sources disagree on the Work | `unresolved` | `identifier_conflict` |
| Network off and not in mirror | `unresolved` | `network_disabled` |

| Situation | L2 | Reason |
|---|---|---|
| Paragraph exists (court-printed) and normalised quote found in it | `verified` | — |
| Quote found in a different paragraph | `failed` | `wrong_pinpoint` (actual paragraph recorded) |
| Quote absent after normalisation; OCR adequate | `failed` | `misquotation` |
| Quote absent; OCR confidence below threshold | `unresolved` | `ocr_quality_insufficient` |
| No printed paragraph numbers | paragraph check `unresolved`; quote check still runs | `paragraph_scheme_absent` |
| Pinpoint is a commercial-reporter page | `not_applicable` | `not_checkable_against_open_source` |
| Pinpoint lands in a headnote | `failed` | `wrong_pinpoint` |

### 5.5 No CAPTCHA bypass (normative)

Conformant resolvers and connectors MUST NOT: (1) include, call or download any CAPTCHA-solving library, model or service; (2) replay, export or share session cookies or tokens outside the built-in browser's per-matter partition; (3) automate form submission past a CAPTCHA or script a portal while the lawyer is absent; (4) crawl portals (T1 is one lawyer action per judgment; bulk history comes from the AWS mirror); (5) send portal credentials anywhere. The built-in browser exposes to the harness only the download event, the bytes, the final URL, response headers, and DOM/screenshot hashes. CT-07 scans dependencies; CT-09 runs the resolver under an egress monitor.

### 5.6 Sources, coverage and `SourceCapture`

Each source is a `Source` with `class`, `coverageWindow` (per court, from/to), `snapshot` and `attribution`. The T2 window is computed by the Stage 1 profiling job from per-year counts against SC listings. Attribution text for T2 travels in every `EvidenceReference` from it and in an attribution annex of evidence packages and produced PDFs.

| `SourceCapture` field | Content |
|---|---|
| `id`, `matter` | ULID URN; matter whose browser partition made it |
| `url`, `finalUrl`, `capturedAt` | Requested and post-redirect URL; time |
| `purpose` | Citation or query the capture served |
| `domSnapshotHash`, `screenshotHash` | SHA-256 of DOM and screenshot (bytes in vault) |
| `downloadHash` | SHA-256 of the PDF = `Manifestation` digest |
| `responseHeaders`, `tlsCertFingerprint` | As received |
| `extractor` | Per-portal parser id and version |
| `gesture` | Proof of a lawyer gesture; no agent-initiated capture |

---

## 6. The three verification standards: NVS, CVS, RTS

| Standard | Verifies | Deterministic blocking gates | Advisory scoring (recorded, routing only) | Suite | Stage |
|---|---|---|---|---|---|
| **NVS** Notebook Verification Standard | Facts extracted from matter documents: synopsis lines, dates, parties, incidents, relations, evidence, FAQ answers, case-law mentions | G1–G7 | Jev/Clef extraction questions (§9.3) | **CT-14** | 2 |
| **CVS** Citation Verification Standard | Authorities cited in drafts | L1 identity, L2 pinpoint and quote (§5, §7) | Jev/Clef L1 disambiguation, L2 pinpoint support, L3 proposition support (§9.4) | **CT-02, CT-04, CT-05** | 3 |
| **RTS** Research and precedent Traceability Standard | Precedent edges and treatment shown in research, the Studio and Case Conference | T1–T5 | Jev/Clef treatment questions (§9.5) | **CT-15** (+ CT-06, CT-12) | 4 |

Common rules [R]: status is derived from the append-only ledger only; an advisory score is stored with model ID and version and may route an item, but never changes status; a lawyer edit creates a new item with `source: user` and its own anchor.

### 6.1 Reference functions

SUPACE and LegRAA are Supreme Court tools whose technical documentation is not public. Only their publicly described functions are used, as functional references (D28):

| Court system | Public function | Our standard |
|---|---|---|
| SUPACE | File preview and cross-file search → chatbot → logic gate (synopsis, FAQs, evidence, case law) → notebook | NVS anchors and gates on every Notebook output (W3) |
| LegRAA | Document analysis, legal-reference extraction, research organisation, Q&A over SC judgments and uploaded documents, human in the loop | RTS edges and gates; CVS for each authority (W11 Studio) |

Nothing here describes their internals. Conformance of our implementation is measured by the Eval agent against NVS/CVS/RTS (§8).

### 6.2 NVS: `NotebookItem` and gates G1–G7

```json
{
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/NotebookItem.json",
  "type": "object",
  "required": ["@type", "id", "matter", "kind", "value", "anchors", "source", "status"],
  "properties": {
    "@type": { "const": "NotebookItem" },
    "id": { "type": "string", "pattern": "^urn:ilo:nb:" },
    "matter": { "type": "string" },
    "kind": { "enum": ["synopsis_line", "date", "party", "incident", "relation", "evidence", "faq", "case_law_mention"] },
    "value": { "type": "object", "description": "date {iso, raw, relativeTo?}; party {canonicalId, aliases[], role}; incident {date?, actors[], event, place?}; relation {subject, predicate, object, timeBound?}; evidence {exhibit, proves}; faq {q, a}; case_law_mention {raw, handOff: CVS}" },
    "presentation": { "enum": ["fact_admitted", "allegation", "finding", "unclear"] },
    "anchors": { "type": "array", "minItems": 1, "items": { "$ref": "EvidenceReference.json" } },
    "source": { "enum": ["extractor", "user"] },
    "gateResults": { "type": "array", "items": { "type": "object", "properties": { "gate": { "enum": ["G1","G2","G3","G4","G5","G6","G7"] }, "pass": { "type": "boolean" }, "reason": { "type": "string" } } } },
    "advisory": { "type": "array", "items": { "$ref": "AdvisoryScore.json" } },
    "band": { "enum": ["auto_pass", "unresolved", "fail"] },
    "status": { "enum": ["extracted", "verified", "lawyer_accepted", "rejected"] },
    "dependsOn": { "type": "array", "items": { "type": "string" } }
  },
  "additionalProperties": false
}
```

| Gate | Check (all must pass for `extracted → verified`) |
|---|---|
| G1 | Anchor resolves: document hash matches the vault manifestation; page and offsets in range |
| G2 | Exact quote match under `ilo-quote-norm-0.1` |
| G3 | Typed values inside the anchor: every date normalises from a string in its anchor; every party name/alias, amount and quoted span appears in an anchor |
| G4 | No unanchored item; each synopsis line and FAQ answer anchored |
| G5 | Referential integrity: incident actors and relation endpoints exist as parties or documents |
| G6 | Date validity and order: ISO-valid; relative dates resolved against a recorded anchor date; impossible orders flagged |
| G7 | Exhibit coverage: every exhibit referenced by an item or explicitly marked unused |

Status: `extracted → verified` (G1–G7 pass; advisory band `auto_pass`, or `unresolved` cleared by a lawyer) `→ lawyer_accepted` (signed `HumanReview`); `rejected` at any point. An item whose `presentation` is `allegation` MUST NOT be rendered as a fact in a draft (defect `fact_vs_submission`).

### 6.3 RTS: `PrecedentEdge`, `TreatmentAssertion`, gates T1–T5

```json
{
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/PrecedentEdge.json",
  "type": "object",
  "required": ["@type", "id", "citing", "cited", "citingParagraph", "treatment", "evidence", "method", "status"],
  "properties": {
    "@type": { "const": "PrecedentEdge" },
    "id": { "type": "string", "pattern": "^urn:ilo:pedge:" },
    "citing": { "type": "string", "pattern": "^ilo:case/in/" },
    "cited": { "type": "string", "pattern": "^ilo:case/in/" },
    "citingParagraph": { "type": "string" },
    "treatment": { "$ref": "TreatmentAssertion.json" },
    "evidence": { "$ref": "EvidenceReference.json" },
    "benchCheck": { "type": "object", "properties": { "citingStrength": { "type": "integer" }, "citedStrength": { "type": "integer" }, "citingDate": { "type": "string" }, "citedDate": { "type": "string" }, "pass": { "type": "boolean" } } },
    "provisionVersions": { "type": "array", "items": { "type": "string" } },
    "conflictFlags": { "type": "array", "items": { "enum": ["amendment_version_conflict", "bench_strength_inconsistent", "pending_reference"] } },
    "method": { "enum": ["deterministic_extraction", "model_proposed", "lawyer_entered"] },
    "advisory": { "type": "array", "items": { "$ref": "AdvisoryScore.json" } },
    "status": { "enum": ["extracted", "verified", "lawyer_accepted", "rejected"] }
  },
  "additionalProperties": false
}
```

`TreatmentAssertion` `{citing{work, passage}, cited{work, proposition?, passage?}, relation, scope: proposition | whole_decision, who: court | counsel | dissent, assertedBy, verification, humanReview}`.

**Treatment vocabulary** (`ilo-vocab/treatment`; the advisory question in §9.5 uses the same labels): `followed`, `approved`, `relied`, `applied`, `distinguished`, `explained`, `doubted`, `referred_larger`, `overruled`, `impliedly_overruled`, `per_incuriam`, `sub_silentio`, `reversed`, `affirmed`, `mentioned`. Negative treatments: `doubted`, `referred_larger`, `overruled`, `impliedly_overruled`, `per_incuriam`, `sub_silentio`.

| Gate | Check |
|---|---|
| T1 | Both cases resolve to corpus Works (CVS L1) |
| T2 | `citingParagraph` exists and the evidence quote matches it (CVS L2 mechanics) |
| T3 | No treatment without an evidence anchor; `who` must be `court` for any treatment shown as the court's |
| T4 | `overruled` / `per_incuriam` shown only with an anchored passage in the later judgment **and** `benchCheck.pass` (citing date after cited date; for overruling, citing bench strength greater than cited; coordinate benches refer rather than overrule); otherwise downgraded to `doubted` + UNRESOLVED |
| T5 | Amendment-version conflict: the same provision cited across different `ProvisionVersion`s is flagged |

Negative treatments always go to the lawyer queue before entering the reference layer. `referred_larger` sets `pending_reference` until a later judgment resolves it.

---

## 7. Verification record, AI-origin manifest and receipt

### 7.1 What counts as "verified"

"Verified" is a property of **one check, at one level, against one named source**, recorded with method and time; never of a document as a whole.

| Level | Question | Deterministic checks | "Verified" means |
|---|---|---|---|
| **L1 identity** | Does the authority exist and is it the decision named? | `citation_parses`, `work_resolves`, `two_identifiers_agree`, `party_names_match`, `decision_date_match`, optional `coram_match` | All listed checks pass against a source of the stated authority level |
| **L2 pinpoint and quote** | Does the paragraph exist and does the quote occur there? | `paragraph_exists` (court-printed), `quote_in_paragraph` (normalised), `quote_exact_raw` (informational), `not_in_reporter_block` | The normalised quote occurs, in order, inside the cited paragraph of the authoritative Expression |
| **L3 proposition support** | Does the passage support the proposition? | None; model or human assessment | **L3 has no `verified`.** It carries a semantic assessment `supported | partially_supported | unsupported | contradicted | unresolved` with method and assessors |

**Two axes, never merged.** `technical ∈ {verified, failed, unresolved, not_checked, not_applicable}` for L1/L2; `semantic.assessment` only at L3. L3 cannot be `supported` if L2 `failed`. L3 MUST be read with RTS treatment: a faithful ratio from an overruled case is still a defect.

**Display badge** (derived by the published function `ilo.summaryBadge(record)`, never stored; first match wins): `FAILED` (any in-scope level failed) → `CONFLICT` (unresolved with `identifier_conflict`) → `VERIFIED_PRIMARY` (all verified/not_applicable, lowest level A) → `VERIFIED_SECONDARY` (lowest level B or C; source named) → `UNVERIFIED` (anything else; reason shown). L3 is shown beside the badge and never changes it.

**Freshness (D13).** `attestsHash` binds a record to the exact draft version and citation occurrence; any edit makes it stale and the badge reverts to `not_checked`.

### 7.2 `VerificationRecord`

```json
{
  "$id": "https://spec.ilac.example/ilo/0.1/schemas/VerificationRecord.json",
  "type": "object",
  "required": ["@type", "id", "target", "levels", "resolution", "standardVersion", "attestsHash", "createdAt"],
  "properties": {
    "@type": { "const": "VerificationRecord" },
    "target": { "type": "object", "required": ["citation"], "properties": {
      "citation": { "$ref": "NeutralCitation.json" },
      "pinpoint": { "type": "object", "properties": { "paragraph": { "type": "string" }, "page": { "type": "integer" } } },
      "quoteHash": { "type": "string" },
      "propositionRef": { "type": "string", "description": "Local id; proposition text never leaves the device" },
      "draftAnchor": { "type": "string" } } },
    "levels": { "type": "object", "properties": {
      "L1": { "$ref": "#/$defs/technicalLevel" },
      "L2": { "$ref": "#/$defs/technicalLevel" },
      "L3": { "$ref": "#/$defs/semanticLevel" } } },
    "resolution": { "type": "array", "minItems": 1, "items": { "$ref": "ResolutionAttempt.json" } },
    "evidence": { "type": "array", "items": { "$ref": "EvidenceReference.json" } },
    "advisory": { "type": "array", "items": { "$ref": "AdvisoryScore.json" } },
    "humanReview": { "$ref": "HumanReview.json" },
    "attestsHash": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "dependsOn": { "type": "array", "items": { "type": "string" } },
    "supersedes": { "type": "string" },
    "standardVersion": { "const": "ilo-cvs-0.1" },
    "software": { "type": "object", "required": ["name", "version"] },
    "createdAt": { "type": "string", "format": "date-time" }
  },
  "$defs": {
    "technicalLevel": { "type": "object", "required": ["technical", "checks"], "properties": {
      "technical": { "enum": ["verified", "failed", "unresolved", "not_checked", "not_applicable"] },
      "authorityLevel": { "enum": ["A", "B", "C"] },
      "checks": { "type": "array", "items": { "type": "object", "required": ["name", "result"], "properties": {
        "name": { "type": "string" }, "result": { "enum": ["pass", "fail", "unknown", "skipped"] }, "detail": { "type": "string" } } } },
      "reason": { "type": "string" },
      "hallucinationClass": { "$ref": "HallucinationClass.json" } } },
    "semanticLevel": { "type": "object", "required": ["technical"], "properties": {
      "technical": { "enum": ["not_checked", "not_applicable", "unresolved"] },
      "semantic": { "type": "object", "properties": {
        "assessment": { "enum": ["supported", "partially_supported", "unsupported", "contradicted", "unresolved"] },
        "holdingStatus": { "enum": ["ratio", "obiter", "assumed", "rejected", "not_addressed"] },
        "voice": { "enum": ["court_holding", "counsel_submission", "lower_court", "dissent", "quoted_precedent"] },
        "method": { "enum": ["model", "human", "model_then_human"] },
        "assessors": { "type": "array" } } } } }
  }
}
```

Instance (wrong pinpoint caught against the Court's copy):

```json
{
  "@type": "VerificationRecord", "id": "urn:ilo:vr:01JE7Q",
  "target": { "citation": { "@type": "NeutralCitation", "scheme": "INSC", "year": 2024, "serial": 23,
              "display": "2024 INSC 23", "work": "ilo:case/in/sc/insc/2024/23" },
              "pinpoint": { "paragraph": "18" }, "quoteHash": "sha256:4c1e…", "draftAnchor": "urn:ilo:draftpara:01JE70" },
  "levels": {
    "L1": { "technical": "verified", "authorityLevel": "A", "checks": [
      { "name": "citation_parses", "result": "pass" }, { "name": "work_resolves", "result": "pass" },
      { "name": "two_identifiers_agree", "result": "pass", "detail": "INSC + CNR/decision_date" },
      { "name": "party_names_match", "result": "pass" } ] },
    "L2": { "technical": "failed", "authorityLevel": "A", "checks": [
      { "name": "paragraph_exists", "result": "pass" },
      { "name": "quote_in_paragraph", "result": "fail", "detail": "found in para 19" } ],
      "reason": "wrong_pinpoint", "hallucinationClass": "wrong_pinpoint" },
    "L3": { "technical": "not_checked" } },
  "resolution": [
    { "@type": "ResolutionAttempt", "tier": "T2", "source": "src:aws-sc@2026-10-29", "acquisitionMode": "mirror_lookup",
      "startedAt": "2026-10-30T10:01:02+05:30", "outcome": "not_found", "reason": "outside_corpus_coverage" },
    { "@type": "ResolutionAttempt", "tier": "T1", "source": "src:sci-neutral-citation", "acquisitionMode": "in_session_human",
      "startedAt": "2026-10-30T10:03:40+05:30", "outcome": "resolved", "manifestation": "sha256:9f2c…" } ],
  "attestsHash": "sha256:77ab…",
  "standardVersion": "ilo-cvs-0.1",
  "software": { "name": "@ilac/verification", "version": "0.1.0" },
  "createdAt": "2026-10-30T10:04:12+05:30"
}
```

**Paragraph and quote procedure** (bit-reproducible given recorded extraction): acquire and hash → extract with a pinned extractor (text layer first; OCR with confidence recorded) → segment reporter blocks; detect court-printed numbering, else derived and labelled → normalise → exact normalised match within the cited paragraph; if absent, search the whole judgment to locate it → emit an `EvidenceReference` with the full selector chain. No fuzzy match may produce `verified`; near hits are reported as `detail` on a `fail`.

### 7.3 Failure taxonomy (Reg 3(1)(z))

`hallucinationClass` (closed): CVS — `fabricated_authority`, `misattributed_authority`, `wrong_pinpoint`, `misquotation`, `misstated_holding`, `submission_cited_as_holding`, `overruled_authority`, `nonexistent_provision`, `superseded_provision`, `unsupported_proposition`; NVS — `fabricated_fact`, `unanchored_item`, `misquoted_record`, `allegation_stated_as_fact`; RTS — `unsupported_treatment`. Every non-`verified` outcome carries a `reason`; `unresolved` is first class. Records are never overwritten: a re-check `supersedes` the old record and both stay in the ledger. A lawyer may file with unresolved checks only through a signed `VerificationWaiver` with written reasons, listed in the manifest.

### 7.4 Plain-language rendering (Reg 3(1)(w))

A normative template renders any record for a lay reader, for example: *"2024 INSC 23: the judgment exists and is the one named (checked against the Supreme Court's own copy, downloaded 30 Oct 2026). The quoted words appear in paragraph 19, not paragraph 18 as cited. Whether the passage supports the argument was not assessed."* Advisory scores are rendered only as "flagged for review by an automated checker", never as a verdict. CT-04 fixes the output for each outcome combination.

### 7.5 `AIOriginManifest` (designed from Reg 43(3)–(4))

The manifest is designed from the regulation text: Reg 43(3) (disclosure of AI-assisted character by declaration or certificate at submission) and Reg 43(4) (the AI System used; the nature and extent of AI assistance; the steps taken to verify accuracy), with Reg 3(1)(y), 8(1), 8(3), 20(1)(h), 43(5) and 43(6). It is an in-toto Statement v1 whose subject is the **exact file submitted**, signed in DSSE with the workspace key, logged as a ledger leaf, and exportable as JSON and as a human-readable declaration.

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [ { "name": "SLP-Crl-2026-draft-v7.pdf", "digest": { "sha256": "b7a1…" } } ],
  "predicateType": "https://spec.ilac.example/ilo/0.1/predicates/ai-origin",
  "predicate": {
    "standardVersion": "ilo-origin-0.1",
    "submissionRole": "pleading",
    "aiAssistedCharacter": { "generativeAIUsed": true,
      "declaration": "This pleading was prepared with the assistance of the AI systems listed below." },
    "aiSystems": [
      { "role": "drafting_assistance", "provider": "…", "model": "…", "versionOrDigest": "…", "access": "openrouter_byo_key" },
      { "role": "advisory_scoring", "model": "clef-flash", "versionOrDigest": "…", "access": "local_ollama" },
      { "role": "citation_verification", "software": "@ilac/verification", "version": "0.1.0", "digest": "sha256:…" }
    ],
    "natureAndExtent": {
      "categories": ["research", "notebook_extraction", "drafting_suggestions", "citation_verification"],
      "aiAssistedPassages": [ { "anchor": "para-7", "acceptedAs": "edited_by_counsel" }, { "anchor": "para-12", "acceptedAs": "verbatim" } ],
      "statement": "AI suggested text for paragraphs 7 and 12; counsel edited paragraph 7 and accepted paragraph 12."
    },
    "verificationSteps": [
      { "step": "notebook_facts", "standard": "ilo-nvs-0.1", "gates": ["G1","G2","G3","G4","G5","G6","G7"], "records": ["…"] },
      { "step": "citation_identity", "standard": "ilo-cvs-0.1#L1", "sourcesInOrder": ["T2", "T1"], "records": ["urn:ilo:vr:01JE7Q"] },
      { "step": "pinpoint_and_quote", "standard": "ilo-cvs-0.1#L2", "records": ["urn:ilo:vr:01JE7Q"] },
      { "step": "precedent_treatment", "standard": "ilo-rts-0.1", "gates": ["T1","T2","T3","T4","T5"] },
      { "step": "human_review_of_support", "method": "human", "by": "AOR" }
    ],
    "summary": { "citations": 23, "L1": { "verified": 23 },
                 "L2": { "verified": 20, "unresolved": 2, "not_applicable": 1 },
                 "L3": { "not_checked": 23 }, "unresolvedReasons": { "outside_corpus_coverage": 2 } },
    "waivers": [ "urn:ilo:waiver:01JE9A" ],
    "syntheticData": { "used": false },
    "aiGeneratedCharacterIfEvidence": null,
    "documentVersion": { "draftId": "urn:ilo:draft:01JE5X", "ledgerSeq": 4412 },
    "humanAttestation": { "role": "AOR", "name": "…", "aorCode": "…",
      "statement": "I have reviewed every AI-assisted passage and every authority cited. I take full responsibility for the contents.",
      "at": "2026-10-30T11:02:00+05:30" }
  }
}
```

| Field | Regulation text it answers |
|---|---|
| `aiAssistedCharacter` + rendered declaration | 43(3) disclosure of AI-assisted character at submission; 3(1)(y) disclosure of origin |
| `aiSystems[]` | 43(4) "the AI System used" |
| `natureAndExtent` | 43(4) "the nature and extent of AI assistance provided" |
| `verificationSteps[]` + `summary` | 43(4) "the steps taken to verify the accuracy"; 3(1)(y) verification |
| `waivers[]` | 8(3) verification dispensed only for reasons recorded in writing |
| `syntheticData` | 43(5) |
| `submissionRole: evidence` + `aiGeneratedCharacterIfEvidence` | 20(1)(h) |
| `humanAttestation` | 8(1), 43(6) responsibility of the filer |

The declaration rendering is a plain certificate generated from these fields; if the Court prescribes a form, a renderer for that form is added without changing the fields. **Declaration-only manifests** (no SDK; self-declared systems; manual verification steps; no records) MUST validate, so lawyers using other software, or none, can comply (Reg 42). AI-detection scores are not an ILO field.

### 7.6 `VerificationReceipt`

A second in-toto Statement whose subject is the **manifest digest** (and through it the file). Issued by whoever re-runs checks: the advocate's SDK (`local_sdk`), a third-party verifier, or a designated court mechanism (`designated_mechanism`).

```json
{
  "_type": "https://in-toto.io/Statement/v1",
  "subject": [ { "name": "ai-origin-manifest", "digest": { "sha256": "e04d…" } } ],
  "predicateType": "https://spec.ilac.example/ilo/0.1/predicates/verification-receipt",
  "predicate": {
    "receiptId": "urn:ilo:receipt:01JEA2",
    "standardVersion": "ilo-cvs-0.1",
    "issuer": { "issuerClass": "local_sdk", "name": "@ilac/cli", "version": "0.1.0", "digest": "sha256:…" },
    "fileDigest": "sha256:b7a1…",
    "checksRerun": [ { "record": "urn:ilo:vr:01JE7Q", "level": "L1", "outcome": "verified", "authorityLevel": "A", "matchesManifest": true },
                     { "record": "urn:ilo:vr:01JE7Q", "level": "L2", "outcome": "verified", "matchesManifest": true } ],
    "checksNotRerun": [ { "level": "L3", "reason": "semantic assessment outside receipt scope" } ],
    "sourcesConsulted": [ { "source": "src:aws-sc", "snapshot": "2026-10-29" }, { "source": "src:sci-neutral-citation" } ],
    "dataReceived": "identifiers_pinpoints_quote_hashes_only",
    "issuedAt": "2026-10-30T11:05:00+05:30",
    "clause": "This receipt records the disclosure made and the checks performed. It is not a determination of truth, admissibility or legal correctness."
  }
}
```

A receipt contains: file and manifest digests; standard version; issuer and software digest; each check re-run with outcome, authority level and match to the manifest; checks not re-run and why; sources consulted with snapshots; data received; time; the fixed non-determination clause; DSSE signature.

### 7.7 Which sources are authoritative

Level A is the Court's own copy (T1); B the open mirror of the official reporter copy (T2); C an aggregator (T3). Reporter headnotes are never the Court's text. For statutes, the Gazette notification or India Code text, recorded with hash. A designated mechanism may declare additional official sources; the spec takes a source registry, not a fixed list.

### 7.8 Verification interface

| Surface | Form | For |
|---|---|---|
| SDK | `@ilac/verification` (TypeScript); types for other languages generated from schemas | Workspaces, drafting tools |
| CLI | `ilac verify draft.pdf --policy filing`, `ilac manifest`, `ilac receipt`, `ilac check-receipt` | Lawyers without a conforming workspace; court IT; auditors |
| Local HTTP | OpenAPI 3.1 on localhost (`POST /verify`, `/manifest`, `/receipt`, `GET /records/{id}`) | Desktop apps in any language |
| MCP adapter | Generated Read-class tools (`verify_citation`, `get_paragraph`, `build_manifest`) | AI agents |
| Evidence package | `.ilac` bundle: JSON-LD objects, DSSE envelopes, optional public PDFs, attribution annex, index | Exchange between applications (CT-03) |
| Designated mechanism API | Same operations, remote, accepting only the minimal-disclosure payload | A Court-run service, if established |

### 7.9 Local-first compliance

Everything runs on the device (T2 mirror, extraction, matching, manifest, receipt). With networking off, records report `network_disabled` or `outside_corpus_coverage`; nothing is upgraded. T1 acquisitions are local lawyer actions; nothing about the draft goes to the portal. A designated mechanism, if any, receives only citation identifiers, pinpoints, public-judgment quotes or their hashes, the manifest digest and its non-confidential fields; never the draft, propositions, client documents, prompts or transcripts (Reg 48(1), (3)). Anyone with the PDF, manifest and receipt can re-check hashes and signatures and re-run L1/L2 offline with the open CLI.

---

## 8. The separate Verifier/Eval agent (W13)

Conformance to NVS, CVS and RTS is measured, not asserted (D15, D28). The runtime verifier (D14) checks individual outputs during work; the **Verifier/Eval agent (W13)** is a separate package and process that measures whole-system conformance.

### 8.1 Independence rules [R]

1. Separate package (`@ilac/eval`) and process; it consumes only exported ILO objects (Notebook items, verification records, precedent edges, manifests) and golden sets.
2. It cannot read generator scratch, prompts, intermediate drafts or builder fixtures; the golden sets it scores against are held out from builders.
3. Its judge models are of a different family from the generator's; Clef and Clef-flash share lineage and count as one vote; a Qwen-family generator is never judged by Clef alone.
4. It never writes to the matter or reference layer; it emits a signed `EvalReport`.
5. Its own code and configuration digest are in every report; a stage closes only on a signed receipt bundle of commit hash + CT results + Eval report (D34).

### 8.2 `EvalReport`

| Field | Content |
|---|---|
| `standard` | `ilo-nvs-0.1` / `ilo-cvs-0.1` / `ilo-rts-0.1` |
| `implementation` | Name, version, commit hash, config hash |
| `goldenSet` | ID, version, hash, size, strata |
| `metrics` | Per item type and per mutation type: precision, recall, false-`verified` count, coverage (share auto-passed), error rate among auto-passed |
| `scorerCalibration` | For each advisory scorer and question id: Brier, ECE, reliability bins, model version string returned by the API |
| `agreement` | Cohen's κ between independent scorers and against adjudicated gold |
| `disagreements` | Items where scorers disagree, sent to an LLM judge or lawyer |
| `verdict` | Pass/fail against the gates in §8.3 |
| `signature` | DSSE |

### 8.3 Gates

| Standard | Gate |
|---|---|
| CVS | Existence recall ≥ 99% and pinpoint recall ≥ 90% on planted sets; **zero false `verified` on planted misquotes**; recent judgments never `failed`; L3 labels shown only if precision on `supported` ≥ 90% and recall on `unsupported`/`unresolved` ≥ 95% on ≥ 500 expert-annotated claims, else the UI shows "citation resolved" only |
| NVS | Zero items reach `verified` with a fabricated date, name or amount; zero unanchored items; error rate among `auto_pass` items ≤ 5% |
| RTS | Zero `overruled` displayed without anchored passage and bench check; negative-treatment recall ≥ 95%; error rate among `auto_pass` treatments ≤ 2% |

### 8.4 Planted-defect suites

For each standard the Eval agent mutates gold items and measures detection recall per mutation type: swap a date; swap parties or relation direction; state an allegation as fact; cite counsel's submission as a holding; wrong pinpoint ±1 and ±5; drop a condition from a ratio; flip `followed` to `overruled`; coordinate-bench "overruling"; fabricated INSC; right INSC with wrong parties; too-recent judgment (must be `unresolved`).

### 8.5 Golden sets

- **Golden judgments**: ≥ 50 SC judgments keyed by INSC, from the AWS mirror and re-acquired from the SC portal (both hashes kept); stratified by decade (including back-assigned INSC), bench strength (2, 3, 5+), headnote and printed-paragraph presence, born-digital vs scanned. Layers: caption metadata, paragraph boundaries, reporter blocks, citation occurrences, typed statements (ratio/obiter, voice), treatment per citation occurrence.
- **Golden matters**: GM-01 (development) and GM-02 (held out), built from public or synthetic records only, with planted defects.
- **Protocol**: two independent annotators (practising advocates or trained law graduates) plus an AOR adjudicator; versioned guidelines; κ per layer; disagreements kept as data. No client material.

---

## 9. Jev and Clef: advisory question schemas (W14)

### 9.1 Contract

The System One decision models (Clef, Clef-flash, Jev) take a `state` (string or JSON) and `questions` (1–64 per request; IDs of letters, digits, `_ . -`, ≤ 100 chars) and return answers under the same IDs, without rationale [F]. Question types: `noul` (true/false; returns P(true)), `choice` (named options; returns choice, probabilities, confidence), `score` (ordered levels, lowest first; returns probability-weighted score). ILO wraps this in two schemas.

**`DecisionRequest`** (stored in the run journal):

```json
{
  "@type": "DecisionRequest",
  "useCase": "nvs_extraction | cvs_identity | cvs_pinpoint | cvs_proposition | rts_treatment | defect_paragraph | defect_page",
  "templateId": "nvs.incident@0.1",
  "templateHash": "sha256:…",
  "backend": "ollama | sglang | openrouter | workers_ai | jev",
  "model": "clef-flash",
  "confidentiality": "public | matter_confidential",
  "state": { "…": "…" },
  "questions": { "…": "…" }
}
```

**`AdvisoryScore`** (attached to the item):

```json
{
  "@type": "AdvisoryScore",
  "request": "urn:ilo:dreq:01JF…",
  "verifier": "clef | clef_flash | jev | other",
  "modelVersion": "as returned in response.model",
  "answers": { "support": { "choice": "supported", "probabilities": { "supported": 0.91, "partial": 0.06, "contradicted": 0.01, "absent": 0.02 } } },
  "calibrationProfile": "cal:nvs.incident@2026-11",
  "band": "auto_pass | unresolved | fail",
  "paraphraseSpread": 0.07
}
```

Rules [R]: the template wording (`instructions`, `criteria`) is part of the model; any change creates a new `templateId` and requires recalibration. `NOT_FOUND` is emitted only by retrieval or deterministic gates, never by a model. Confidential matter text goes only to a local (Ollama) or self-hosted backend; Jev and hosted backends receive public text only until written retention terms exist (D16).

### 9.2 Pipeline

```
item ─► deterministic gates (veto) ─fail─► FAIL with reason code (no model call)
           │ pass
           ▼
        Clef-flash triage (all items)
           │ probability inside the ambiguous band, or high-stakes type
           ▼
        Clef 27B (+ Jev on public text) ─► combined, calibrated score
           │
           ▼
        per-type thresholds ─► AUTO-PASS / UNRESOLVED → lawyer / FAIL
```

Outputs map to four states: SUPPORTED, CONTRADICTED, NOT_FOUND (gates only), UNRESOLVED.

### 9.3 NVS question templates

One request per (Notebook item, source passage); `state` = `{item, passage_ref, passage}` with the passage kept to the anchored paragraph ± 1. Batching items that share a passage is allowed with prefixed IDs (`i17.date_ok`), capped at about 6 items / 40 questions per call.

| Template | Questions |
|---|---|
| `nvs.incident` | `support` (choice: supported / partial / contradicted / absent); `date_ok`, `actor_ok`, `event_ok` (noul); `place_ok` (choice: stated / inferable / absent / conflict); `presentation` (choice: fact_admitted / allegation / finding / unclear) |
| `nvs.party` | `name_match` (noul); `role` (choice: petitioner / respondent / appellant / accused / complainant / witness / third_party); `represented_by` (noul) |
| `nvs.date` | `date_of_what` (choice over candidate events); `date_explicit` (noul); the date string itself is gated by G3/G6 first |
| `nvs.relation` | `relation_stated`, `direction_correct` (noul); `time_bounded` (choice: current / past / unclear) |

`presentation` populates `NotebookItem.presentation` only after lawyer confirmation; an `allegation` stored as fact is a defect.

### 9.4 CVS question templates

| Level | `state` | Questions |
|---|---|---|
| L1 identity disambiguation (parser returned > 1 candidate) | Draft context sentence + candidate cards (title, court, bench, date, citation) | `identity` (choice: c1 … cn / none). Auto-select only if top probability ≥ τ_id and margin ≥ δ; otherwise ask the lawyer; `none` → NOT_FOUND path, never auto-selected |
| L2 pinpoint support | Proposition + cited paragraph ± 1 | `pin_support` (choice: direct / adjacent / partial / no / contra); `voice` (choice: court_holding / counsel_submission / lower_court / dissent / quoted_precedent); `quote_faithful` (noul) |
| L3 proposition support | Proposition + retrieved top-k paragraphs + operative order (fits Clef 27B context; retrieval-pruned otherwise) | `holding_status` (choice: ratio / obiter / assumed / rejected / not_addressed); `scope_match` (score: different issue → overbroad → conditions omitted → faithful); `still_good` (noul) |

`voice = counsel_submission` on a passage cited as a holding raises `submission_cited_as_holding`. L3 results populate `semanticLevel` only; they never change L1/L2.

### 9.5 RTS question template

`rts.treatment`: `state` = citing paragraph(s) + cited case card. Questions: `treatment` (choice over `ilo-vocab/treatment` plus `not_about`); `scope` (choice: whole / point / unclear); `who` (choice: court / counsel / dissent). Gate T4 then applies bench strength and date. Negative treatments are thresholded for recall (flag at P ≥ 0.15) and always go to the lawyer queue. Public judgment text: Jev may serve as a second, heterogeneous scorer.

### 9.6 Defect templates (W6)

Per draft paragraph, `state` = `{paragraph, chronology from Notebook, record extracts}`: `unsupported_fact`, `fact_vs_submission`, `date_inconsistent`, `relief_mismatch` (noul); `severity` (score: none → cosmetic → would draw an objection → could defeat relief or mislead the court). Page-level registry checks (e.g. deponent signature and attestation present) use Clef vision; most registry defects are deterministic. The explanation shown to the lawyer comes from a generative reviewer told which flag fired.

### 9.7 Calibration and thresholds

1. **Label set** per template: 300–500 lawyer-labelled items, SC first, plus a held-out HC shift slice; 20% double-labelled for inter-annotator agreement (the ceiling).
2. **Measure** reliability, ECE and Brier per (model, backend, template); a local quantised model is calibrated separately from the hosted model.
3. **Recalibrate** per template (temperature, Platt or isotonic); refit whenever wording changes.
4. **Thresholds by conformal risk control**: error among auto-passed ≤ 2% for citations and negative treatments, ≤ 5% for Notebook facts; report coverage. Two thresholds give three bands.
5. **Cascade calibrated as a whole** (Clef-flash → Clef → lawyer), not stage by stage.
6. **Paraphrase check**: three paraphrases per template; a spread > 0.15 on an item sends it to UNRESOLVED.
7. **Pin versions**: record `model` from every response; a changed model string invalidates the calibration profile.

---

## 10. SDK packages and conformance suites

### 10.1 `@ilac` packages

All TypeScript, generated from ILO schemas, no telemetry, no default network endpoint. Module IDs are the Vakilbench workspace modules that consume each package (C4).

| Package | Contents | Used by | Stage |
|---|---|---|---|
| `@ilac/schemas` | JSON Schemas, JSON-LD contexts, validation rules, vocabularies, test vectors; no code | All | 0 |
| `@ilac/ontology` | Generated types and validators; JCS hashing; ULIDs; schema → tool compiler (OpenAPI 3.1, MCP); patch-proposal envelope | W0, all | 0 |
| `@ilac/corpus` | AWS SC/HC parquet loaders, profiling job, field-to-ILO mappers, vocabulary builders | W2, W11 | 1 |
| `@ilac/identifiers` | INSC parser/normaliser, SCR/eSCR locator parser, report-citation locators, CNR shape check; HC registry later | W5 | 0 |
| `@ilac/evidence` | `EvidenceReference`, selectors, quote normalisation, `.ilac` bundle, PROV-O export | W2, W3, W5 | 1 |
| `@ilac/resolver` | Source registry, coverage windows, T2 mirror adapter (DuckDB/parquet), T1 adapter (download-event capture only), T3 adapter (user webfetch/API) | W5, W7 | 1–3 |
| `@ilac/notebook` | NVS schemas, gates G1–G7, ledger-derived status | W3 | 2 |
| `@ilac/verification` | CVS L1/L2, `VerificationRecord`, plain-language renderer, L3 assessor interface | W5 | 3 |
| `@ilac/origin` | `AIOriginManifest`, `VerificationReceipt`, `RunManifest`, DSSE sign/verify, declaration-only builder | W9 | 3 |
| `@ilac/decisions` | System One client (`state`, `questions` → `answers`) with backends {ollama, sglang, openrouter, workers_ai, jev}; question templates §9; calibration profiles; band computation | W14 | 2 |
| `@ilac/precedent` | RTS `PrecedentEdge`, `TreatmentAssertion`, gates T1–T5, bench registry | W11 | 4 |
| `@ilac/temporal-law` | Provision versions, governing-date queries, optional AKN loader | W11 | 4 |
| `@ilac/eval` | Verifier/Eval agent: golden-set runners, planted-defect generators, metrics, `EvalReport` | W13 | 0 (skeleton), 2–5 |
| `@ilac/conformance` | Language-neutral fixtures and expected outputs; runners | CI, W13 | 0 onward |
| `@ilac/cli` | `ilac verify | manifest | receipt | check-receipt | mirror sync | profile | conformance run | eval run` | Standalone | 0 onward |

Semver per package; every object names `standardVersion`; releases are signed.

### 10.2 Conformance suites

| Suite | Proves | Key fixtures | Stage |
|---|---|---|---|
| **CT-01 Schema** | Objects validate; two-layer rules; JCS hash vectors; full SC metadata loads with no unmapped field | Party-asserted `JudicialFinding` fails; matter node with reference IRI as id fails | 0 |
| **CT-02 Identifiers** | INSC and report-citation parsing/normalisation | ≥ 500 strings mined from SC metadata and judgments; Law and Justice Wiki citations; malformed set | 3 |
| **CT-03 Evidence round-trip** | Export from implementation A, import into B: Work, paragraph, quote, provenance preserved; headnote cannot take `para=n` | Public SC PDFs from the mirror | 1 |
| **CT-04 Verification reporting (CVS)** | Planted defects land on the right level, axis, reason and class; plain-language vectors | Fabricated INSC; wrong parties; wrong paragraph; misquote; commercial-reporter pinpoint; too-recent judgment (`unresolved`, never `failed`); submission cited as holding | 3 |
| **CT-05 Resolver order** | T1/T2/T3 order and policy; attempts logged; two-identifier rule; authority level | Simulated sources with conflicts and outages | 3 |
| **CT-06 Temporal law** | Correct provision version on a governing date | IPC s.302 / BNS s.103 for 30 Jun vs 1 Jul 2024 | 4 |
| **CT-07 Permissions and prohibited code** | Out-of-class calls refused; Commit needs approval; no CAPTCHA solver or session export | Agent attempts Commit under Prepare; dependency scan | 0 |
| **CT-08 Manifest and receipt** | Manifest binds file digest; receipt binds manifest; altered byte fails; declaration-only validates; clause present; every Reg 43(4) field populated | Altered-PDF fixture | 3 |
| **CT-09 Egress** | Under deny-all, only configured calls leave; minimal-disclosure payload has no draft or proposition text; confidential decision requests never reach hosted backends | Instrumented run | 3 |
| **CT-10 Cascade** | Failed/retracted dependency flags all dependants with the right kind; export blocked | Draft with dependent paragraphs | 3 |
| **CT-11 Competency questions** | Each CQ answers correctly over fixtures | CQ1–CQ16 | 1–4 |
| **CT-12 Treatment** | Proposition-level relations; doctrinal checks | One citing judgment following A and distinguishing B | 4 |
| **CT-14 NVS** | G1–G7 enforced; status only from ledger; advisory score never changes status | Planted fabricated date, name, amount, misquote, unanchored synopsis line, dangling relation, impossible order, unreferenced exhibit, allegation stated as fact | 2 |
| **CT-15 RTS** | T1–T5 enforced; no `overruled` without anchored passage and bench check; amendment-version conflict flagged | Unanchored treatment; coordinate-bench "overruling"; BNS/IPC clash | 4 |
| **CT-16 Advisory scoring** | Gates veto before any model call; template hash and model version recorded; band computed from calibration profile; NOT_FOUND never model-emitted; paraphrase-spread rule applied | Mock backends returning fixed probabilities | 2 |

### 10.3 `ConformanceReport`

A conformance run emits a signed `ConformanceReport` (implementation, version, digest, suites, pass/fail per fixture, Eval report references). It is the artefact a developer can attach to an impact assessment (Reg 35) and the basis for a class-basis argument (Reg 8(3)); approval stays with the Court.

---

## 11. Governance and neutrality

| Safeguard | Mechanism |
|---|---|
| Separation of standard and product | Commons repositories owned by a neutral entity; Vakilbench consumes released packages like any other implementation |
| Open terms | Code and SDK under an open-source licence; spec prose under an open content licence; attribution for reused repositories and datasets to be completed before public release |
| Contributions | DCO sign-off; no rights assignment to any company |
| Process | Public ILO-RFCs (§3.9) with CQs, data checks and recorded decisions listing approvers' affiliations; the founder's company holds no veto |
| Equal conformance | Vakilbench is tested by the same public suites and listed on the same results page |
| No telemetry | SDK and workspace ship with none; CT-09 enforces |
| Hand-over readiness | Spec, suites and reference code are structured so that a body under the Regulations (Apex Body, AI Committee, or the AI Content Verification Authority under Reg 44) can take over versioning |
| Respect for court control | Nothing in the Commons claims to bind private tools or to constitute approval under Reg 33; interoperability is not approval |

---

## 12. Grammar of proof, not engine of execution

The Commons standardises the **grammar of proof** (what a verification claim must say, how it is bound to a document, how anyone checks it), not the **engine of execution** (how a given tool or court system produces it). Sharing a verification standard never requires revealing source code, algorithms, model weights, training data or confidential text. Four mechanisms make this work [R]:

1. **Schema separated from code.** The standard is published as interface specifications (JSON Schema 2020-12, JSON-LD context, validation rules, OpenAPI operations): field names, types, permitted values (`technical: verified | failed | unresolved …`). Court systems, Vakilbench and third-party tools can run entirely different engines in any language as long as inputs and outputs validate. The Court's internal systems, prompts, weights and infrastructure stay private.
2. **Hash-binding with zero text upload.** The client computes a SHA-256 digest of the exact final PDF; citations are anchored to public coordinates, `(2024 INSC 412, para 18, quoteHash sha256(…))`, not to proprietary database keys. Verification checks the quote against the official text without ingesting the surrounding confidential work product (§7.9).
3. **Signed receipts verifiable offline.** The tool that ran verification emits a receipt carrying the steps and the document digest, wrapped in DSSE over RFC 8785 canonical JSON and signed with an asymmetric key (§7.6). A registry scrutiny officer, judge or opposing advocate verifies it with the issuer's public key, offline, with no access to the issuer's code; altering one byte of the file or manifest invalidates it.
4. **Canonical identifiers over public data.** The authorities checked are public records. INSC citations, CNR numbers and Gazette dates are public constants; the Court (via eSCR or its internal systems) and the advocate (via the AWS mirror or public portals) refer to the same paragraph index (§4).

```
Advocate's tool (Vakilbench or any other)
  runs verification locally · SHA-256 of petition
        │  receipt bound to PDF hash
        ▼
Shared open schema (ILO)          ◄── specification only, no code
  validates receipt structure
        │  signature check
        ▼
Court registry gate
  validates receipt offline · no access to vendor code
```

| Draft Regulation | Institutional constraint | How a schema-only standard complies |
|---|---|---|
| **Reg 38(2)** | Source code, algorithms and datasets of court AI systems are not shared outside court premises for audits | Preserved: the Court releases no code; SUPACE, LegRAA and registry systems stay behind court and NIC infrastructure; only the schema is common |
| **Reg 3(1)(y)** | Disclosure of AI origin and verification through a designated centralised mechanism | The mechanism can be a published verification schema plus a public-key registry of issuers, rather than a central server to which private filings are uploaded |
| **Reg 43(3)–(4)** | Declaration of AI-assisted character; on requirement, the AI system used, nature and extent of assistance, steps taken to verify | The `AIOriginManifest` (§7.5) is machine-readable and generates the declaration and each Reg 43(4) field from recorded data |
| **Reg 8(3)** | Administrative tools certified by the AI Secretariat satisfy verification on a class basis | The Court can publish the conformance suites (§10.2); software that passes is certifiable as a class without inspecting proprietary source code |

**Design principle carried into the workspace.** SUPACE is publicly described as augmented intelligence: its logic gate organises material from the record (synopsis, chronology, evidence, cited case law) for quicker access and does not evaluate merits or suggest outcomes. The Notebook (W3) and the Research & Argument Studio (W11) adopt that principle: they organise, anchor and trace; they never score merits or predict outcomes. The MOTO engine (W12) proposes candidate arguments only as labelled hypotheses for the lawyer to accept or reject, and argument spans from pleadings can never pass as findings (NVS `presentation`, RTS `who`).

---

## 13. Court proposal: SCBA, SCAORA and the Court

### 13.1 The proposition

We do not ask anyone to endorse or procure a product. We ask the Court to define and own a small piece of infrastructure its own draft Regulations already call for, and we offer an openly licensed draft and reference implementation as input.

**Title:** *Court-Controlled Open Standard and Reference Implementation for Verifying AI-Generated Legal Content.*

**Requests to the appropriate authority, in priority order:**
1. **Define the minimum verification requirements under Reg 3(1)(y)**: what is checked (L1 identity, L2 pinpoint and quote; L3 support explicitly outside "verification"), against which sources, with which outcome vocabulary including "unresolved".
2. **Publish a common verification specification** openly (offered: ILO `ilo-cvs`, `ilo-nvs`, `ilo-rts`, `ilo-origin`, INSC identifier).
3. **Adopt or commission an open reference SDK and local CLI** (offered: `@ilac/*`, transferable).
4. **Establish the designated mechanism as schema + public-key issuer registry + conformance suite** (§12), with any service run on court premises (Reg 38(2)) and accepting only minimal-disclosure payloads, so no pleading is uploaded.
5. **Permit compatible third-party applications to integrate**, subject to approval and security requirements.
6. **Develop common legal data schemas and ontology** (ILO §3) through a Court-supervised working group, as a later phase.

**What the Court keeps:** the standard and its versions, approvals (Reg 33(3)(a)), security requirements, the designated mechanism, and the relationship with the AI Content Verification Authority (Reg 44). **What we contribute:** draft spec, reference code, conformance suites, golden sets, maintainers' time. **Neutrality:** competing implementations are invited; conformance is a public test.

### 13.2 Route

The comment window on the draft has closed. Live routes are **Reg 33(6)** (AI Committee may call for suggestions from universities, researchers and the private sector) and **Reg 57** (periodic review), plus the Bar associations' standing channels. The proposal attaches to functions ("disclosure and verification of GenAI content", "AI Content Verification Authority", "common standards"), citing draft numbers as current references.

### 13.3 What we ask of SCBA and SCAORA

1. Nominate AORs and juniors to a founding working group on evidence identity and citation verification.
2. Write competency questions and annotation guidelines; adjudicate golden judgments.
3. Facilitate a voluntary AOR pilot of Vakilbench and the bare CLI on real filings (manifests generated, not necessarily filed).
4. If satisfied, carry the proposition (§13.1) to the Court as a Bar request for a Court-owned standard.

### 13.4 What we bring

- The two-pager and this specification.
- A live demonstration: two independent implementations (Vakilbench and the bare CLI) exchange a `.ilac` package for a public SC judgment and re-verify the same paragraph and quote identically (CT-03); a planted wrong pinpoint is caught; a too-recent citation is reported "unresolved: outside corpus coverage"; a manifest and receipt are produced and checked offline by a third party.
- The public conformance and Eval results page, including Vakilbench's own.

### 13.5 What we will not claim

That the Regulations are notified; that a receipt is a court determination; that conformance equals approval; that L3 support assessment or an advisory model score is "verification"; that any source other than the Court's own copy is authoritative at level A.

---

## 14. Delivery by stage

| Stage | Standard artefacts delivered | Closes on |
|---|---|---|
| **Stage 0** | `ilo-core`, `ilo-identifier` (INSC, SCR), `ilo-permission`, `ilo-agent`, `@ilac/schemas`, `@ilac/ontology`, tool compiler, `@ilac/eval` skeleton | CT-01, CT-07 |
| **Stage 1** | SC/HC corpus profile; field-to-ILO mappers; vocabularies (disposal, case type, party role, judge); `ilo-document`, `ilo-anchor`, `ilo-source`; `@ilac/evidence`, `@ilac/corpus`; glossary seed | CT-03; SC metadata loads with no unmapped field |
| **Stage 2** | NVS (`ilo-notebook`, gates G1–G7); `@ilac/decisions` with NVS templates and first calibration profiles | CT-14, CT-16; Eval NVS report |
| **Stage 3** | CVS (`ilo-verify`, resolver T1/T2/T3), `ilo-origin` manifest and receipt, `ilo-filing`, plain-language renderer | CT-02, CT-04, CT-05, CT-08, CT-09, CT-10; GM-01; Eval CVS report |
| **Stage 4** | RTS (`ilo-authority`, `PrecedentEdge`, T1–T5), `ilo-law` (IPC/BNS, CrPC/BNSS, Evidence Act/BSA), treatment templates | CT-06, CT-12, CT-15; Eval RTS report |
| **Stage 5** | `ilo-argument` for MOTO candidates; full suites on GM-01/GM-02; public conformance page | All CT suites green; held-out GM-02; external reviewer verifies receipts offline |
| **P1–P3** | Gateway issuer registry and witnessed log (P1); HC resolver and HC neutral-citation registry (P3) | — |

---

## 15. Open items

| # | Item | Closing action |
|---|---|---|
| O-1 | Exact field list, fill rates and semantics of the SC parquet (`case_id`, `nc_display`, `path` `S_` prefix, language fields) | Stage 1 profiling job; publish `corpus-profile` |
| O-2 | HC dataset metadata fields per court | Profile each court's partitions; extend §3.4 |
| O-3 | Stability of back-assigned INSC numbers | Compare 100 `nc_display` values with SC listings and printed copies |
| O-4 | SC portal behaviour (CAPTCHA, download flow, listing completeness per year) | Walkthrough in the built-in browser; record per portal |
| O-5 | T2 coverage window and recent-judgment gap | Profiling job |
| O-6 | Final numbering and content of the Regulations on notification | Track notifications; re-issue §2 |
| O-7 | Context length actually honoured for Clef/Clef-flash on each backend | Needle tests at 3k, 20k, 50k tokens |
| O-8 | Calibration of Clef, Clef-flash and Jev on Indian legal entailment and treatment | Build the label sets (§9.7) |
| O-9 | Jev API details, retention, region | Obtain written terms before any matter text |
| O-10 | Neutral namespace domain | Register before 0.1 freeze |
| O-11 | SC Registry defect list for `ilo-vocab/defect` | Obtain from SCAORA members |
| O-12 | Advocate signing keys (workspace key vs DSC) for DSSE | Evaluate DSC usability |
