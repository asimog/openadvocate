# Vakilbench: Verifiable Legal AI for India
### Two-page overview: the Commons, the Open Code of Litigation, and the commercial service

*30 October 2026*

## The problem

Indian legal information is public but hard to verify. Judgments sit as PDFs with no stable paragraph identity, citations are checked by hand, and statute versions drift. Generative AI makes this urgent: courts, including the Supreme Court in 2026, are already dealing with fabricated citations, and models still miss many wrong paragraph pinpoints even when they catch fake cases.

The Supreme Court's draft *Regulations for Use of AI in Courts, 2026* (circulated with a notice dated 03.06.2026; not yet notified) create a specific need:

- **Reg 3(1)(y):** no GenAI content may be filed without disclosing its origin and verifying it "through a designated centralised mechanism", which is not yet defined.
- **Reg 43(3)–(4):** advocates disclose AI assistance; the Court may require the AI system used and the steps taken to verify accuracy.
- **Reg 43(6):** the filer bears full responsibility for AI errors.
- **Reg 44:** an AI Content Verification Authority; **Reg 33(3):** AI Committees develop common standards.

A duty to verify is not a specification. What counts as a verified citation? Which sources are authoritative? How are failed or inconclusive checks reported? What must a receipt contain? How does a local tool comply without uploading confidential pleadings?

## Three parts

**1. Indian Legal AI Commons (open standard).** A Court-governable, openly published standard anyone can implement: an ontology built from Supreme Court and High Court judgment metadata; canonical document and paragraph identity with page, line and quote anchors; three verification standards; an AI-origin manifest and signed verification receipt bound to the document by hash; open SDKs (`@ilac/*`), the `ilac` CLI and conformance suites CT-01–CT-16.

**2. Open Code of Litigation (open-source Windows app).** A local workspace for advocates, fully open source, bring-your-own key (OpenRouter) or a local model. It is the reference implementation of the Commons.

**3. Commercial service (later).** Managed hosting, chamber collaboration, hearing rehearsal and custom models on the same open core. The Commons and the app never depend on it.

## The MVP

The MVP is a **Windows desktop application** shipped as a signed `.exe` installer with auto-update (Electron), one workspace per matter, a built-in Chromium browser, a built-in Docxodus editor, and a local SQLite journal with a hash-chained ledger. No server, no account. Supreme Court documents are in English; regional-language records come after the MVP.

Built in six evidence-gated stages:

| Stage | Delivers |
|---|---|
| 0 | Windows shell, installer, journal, model access, schemas, ledger |
| 1 | Matters, documents and evidence, OCR and anchors, SC corpus mirror, built-in browser |
| 2 | **Notebook & case graph** under NVS |
| 3 | **Citation verifier** under CVS, editor, defect checker, manifest and receipt |
| 4 | **Research & Argument Studio** under RTS |
| 5 | **MOTO engine** and public Windows release = MVP complete |

All modules are in the MVP:

- **Notebook & case graph** (functions referenced from SUPACE's public description): searchable file preview, matter chatbot, logic-gate extraction of synopsis, dates, parties, incidents, relations, evidence, FAQs and case-law mentions, and an integrated notebook editor. Following SUPACE, the logic gate **organises the record and never evaluates merits**.
- **Citation verifier:** INSC citations resolved in a fixed order: Supreme Court (the lawyer solves any CAPTCHA in the built-in browser; the PDF is hashed; no bypass) → AWS Open Data corpus → Indian Kanoon. Identity, pinpoint/quote and support are reported separately; "outside coverage" is never "failed".
- **Research & Argument Studio** (functions referenced from LegRAA): a research layer over the SC corpus and matter documents with reference extraction and anchored Q&A; a precedent graph with treatment ("overruled" only with an anchored passage and a bench-strength check); temporal law (IPC→BNS etc.); and a human-chaired **Case Conference** reviewing issues and arguments.
- **MOTO Argument Hypothesis Exploration Engine:** a separate module that generates and tests candidate arguments and feeds them into the Studio; the lawyer accepts or rejects.
- Defect checker, editor with agent edits as tracked changes, review UI, ledger and manifest export.

SUPACE and LegRAA are private Court tools with no public technical documents; we reference their described functions only and build our own code from available open repositories.

## Three standards

- **NVS (Notebook Verification Standard):** every Notebook fact anchored to a source quote and deterministically checked; an allegation can never be stored as a fact.
- **CVS (Citation Verification Standard):** identity, pinpoint and quote, and support, with technical and semantic outcomes kept apart.
- **RTS (Research Traceability Standard):** every authority and treatment edge traceable to an anchored passage.

## How verification is decided

- **Gate first.** Deterministic checks decide. Jev and Clef (System One decision models) score extraction, citation support and treatment; scores are recorded and used for routing, never as the sole gate (CT-16).
- **Independent checking.** One generating agent plus an independent runtime verifier, and a **separate Verifier/Eval agent** that measures conformance to NVS, CVS and RTS on held-out golden matters. Its signed reports close each stage.
- **Grammar of proof, not engine.** The Commons standardises what a verification claim must say and how anyone checks it, not how a tool produces it. Receipts bind to hashes and canonical public identifiers, so a registry can verify a filing offline with **zero text upload** and without seeing anyone's code.

## After the MVP

1. **Gateway and website**, immediately after the MVP: accounts, shared matters, server profile.
2. macOS and Linux builds.
3. eCourts connectors, High Courts, regional-language records.
4. Commercial service.

## What makes it believable

Public conformance suites; planted-error benchmarks with published precision and recall; reproducible replays from the ledger; third parties verifying receipts offline; and blind review of outputs by practising Advocates-on-Record.

## How we approach the Court

We do not ask for endorsement of a product. Through the SCBA and SCAORA we propose one institutional step: the Supreme Court establishes an openly documented, Court-controlled standard for verifying AI-assisted legal content, with a public reference SDK.

- **We contribute** the draft specification and the open implementation.
- **The Court keeps** the standard, approvals under Reg 33(3)(a), and the designated mechanism.
- **Neutrality:** the architecture is published and competing implementations are invited.

*The Court controls the standard; it need not control every application that implements it.*
