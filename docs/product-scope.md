# Product Scope

Vakilbench is an open-source, local-first litigation workspace for Indian advocates practising before the Supreme Court. It ships as a signed Windows desktop app. Every fact, quote and citation it produces carries a verifiable record that a court or registry can check offline.

Source of truth: [C4](C4-master-product-plan.md) for modules and acceptance, [C3](C3-master-research-and-architecture.md) for decisions D1 to D35 and stages, [C5](C5-master-standards-and-ontology-plan.md) for the normative standards. This page summarises them. Where it disagrees with the canon, the canon wins.

## The problem

The Supreme Court's draft *Regulations for Use of AI in Courts, 2026* (circulated 3 June 2026, not yet notified) require that AI output be verified (Reg 3(1)(y)), that AI assistance be disclosed at filing (Reg 43(3)), and that the filer can state what system was used and how its output was checked (Reg 43(4)). The filer bears full responsibility (Reg 43(6)).

General-purpose AI tools give an advocate fluent drafts with no proof. A fabricated citation, a wrong pinpoint, or a misread record lands on the advocate. Vakilbench makes verification the default path and produces the disclosure the Regulations ask for.

## Who it is for

| User | What they get |
|---|---|
| Advocate on Record and their chamber | A per-matter workspace that extracts the record, checks citations, drafts with tracked changes and exports a filing with a manifest and receipt |
| Court registry or opposing counsel | An offline `ilac verify` CLI that checks a filing's receipt without seeing any draft or client text |
| Other legal-tech builders | The open Commons standards, schemas, SDKs and conformance suites to build their own conforming tools |

## The three parts

| Part | What it is | When |
|---|---|---|
| 1. Indian Legal AI Commons | Open standards: ILO ontology, NVS/CVS/RTS verification standards, AI-origin manifest and receipt, `@ilac/*` SDKs, `ilac` CLI, conformance suites CT-01 to CT-16 | Ships with the MVP |
| 2. Vakilbench workspace | The Windows Electron app, all modules W0 to W14 | The MVP |
| 3. Gateway, other OSes, connectors, commercial | P1 to P4 | After the MVP |

## Product guarantees

These are enforced in code, not left to model judgement.

1. **Agents never write the record.** They propose typed patches through tools compiled from the schemas. A deterministic kernel validates and commits each one with a ledger event.
2. **Everything is anchored.** Every fact, quote and citation points to a hashed source at page, paragraph and line.
3. **Deterministic gates decide.** Jev and Clef models score only what passed the gates. They are never the sole gate.
4. **No agent grades itself.** A runtime verifier from a different model family checks generative claims. A separate Eval agent measures conformance and closes each stage.
5. **AI edits are proposals.** Every agent edit to a document is a tracked change the advocate accepts or rejects.
6. **Citations resolve in a fixed order.** Supreme Court official source, then AWS Open Data mirror, then Indian Kanoon. Every attempt is recorded. "Missing" is never reported as "fabricated".
7. **No CAPTCHA bypass.** The advocate solves any CAPTCHA in the built-in browser. The capture is hashed.
8. **"Verified" is version-bound.** It needs fresh evidence hashed to the exact version. A newer version resets to `not_checked`. Retractions cascade to dependents and block export.
9. **Every filing is attestable.** Export produces an AI-origin manifest and a signed receipt bound to the exact PDF bytes.

## MVP modules

| ID | Module | What the advocate does with it | Stage |
|---|---|---|---|
| W0 | Shell, model access, installer | Installs the app, enters an OpenRouter key or a local model endpoint | 0 |
| W1 | Matters | Creates a matter with forum, parties and governing date | 1 |
| W2 | Documents and evidence | Drops in PDFs, scans and DOCX. Views them with an anchor layer | 1 |
| W7 | Built-in browser | Opens court portals and captures pages into the vault | 1, 3 |
| W3 | Notebook and case graph | Reviews extracted facts, chronology, parties and issues. Asks anchored questions | 2 |
| W4 | Agent runtime | Runs research and drafting agents with a runtime verifier | 2, 3 |
| W10 | Review and verification UI | Accepts, edits or rejects items. Cannot bulk-approve unresolved ones | 2 |
| W14 | Jev/Clef decision scoring | Sees calibrated scores shown apart from status | 2 |
| W5 | Citation verifier (CVS) | Sees each citation's audit card with existence, pinpoint and support outcomes | 3 |
| W6 | Defect checker | Gets a defect memo by SC Registry category | 3 |
| W8 | Editor (Docxodus) | Edits DOCX with tracked changes. Accepts or rejects agent proposals | 3 |
| W9 | Ledger and manifest export | Exports DOCX, PDF/A, manifest, receipt and declaration draft | 0, 3 |
| W11 | Research and Argument Studio | Researches an issue, sees anchored treatment, builds an argument board, runs a Case Conference | 4 |
| W12 | MOTO hypothesis engine | Receives candidate arguments in the Studio inbox to accept or reject | 5 |
| W13 | Verifier/Eval agent | Not user-facing. Produces conformance reports that close stages | 0 to 5 |

SUPACE and LegRAA (the Court's own tools) are functional references for W3 and W11. Their internals are not public, so our code is our own and conformance is measured against our published standards.

## In scope for the MVP

1. Windows 10 22H2+ and Windows 11, x64.
2. Supreme Court matters, English-language records.
3. BYO model key through OpenRouter, or a local OpenAI-compatible endpoint.
4. Citation verification for Supreme Court judgments (INSC neutral citations and report citations).
5. Temporal law for the 2024 criminal code transition: IPC/BNS, CrPC/BNSS, IEA/BSA.

## Out of scope

| Excluded | Why | Where it goes |
|---|---|---|
| Win probability, outcome or judge prediction | Not a permissible or defensible use | Never |
| Model training | Not our product | Never |
| Hosted gateway, accounts, shared matters | Nothing in the MVP depends on a server (D33) | P1 |
| macOS and Linux | Windows is where Indian litigators work (D3) | P2 |
| High Courts, eCourts connectors, Hindi and regional OCR | SC records are English (D35) | P3 |
| Managed hosting, collaboration, hearing rehearsal | Commercial layer on the open core | P4 |

## MVP done means

All of the following, from [C4 §2.4](C4-master-product-plan.md):

1. The 15-step acceptance script passes on the held-out golden matter GM-02, run by an advocate outside the build team on a clean Windows machine.
2. CT-01 to CT-16 are green in CI on Windows 10 and 11.
3. Eval agent reports for NVS, CVS and RTS on held-out sets meet each module's targets.
4. Citation resolver: existence recall ≥ 99%, pinpoint recall ≥ 90%, zero false `verified` on planted misquotes.
5. The `ilac` CLI, written against the spec rather than app internals, verifies every package the app emits.
6. A signed public installer is published. Auto-update works. Uninstall leaves matter folders intact.
