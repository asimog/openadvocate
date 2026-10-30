# Vakilbench canon: index

Current to 30 October 2026. Decisions D1–D35, Stages 0–5, P1–P4, modules W0–W14 and suites CT-01–CT-16 are defined in C3 (decisions, stages) and C4/C5 (modules, suites); all documents use these IDs.

## Summaries

Short, current entry points. The canon below wins on any conflict.

| File | What it covers |
|---|---|
| `product-scope.md` | Problem, users, guarantees, MVP modules, in and out of scope, definition of done |
| `architecture.md` | Layers, process model, write and verification paths, storage, model access, tech choices |
| `implementation-plan.md` | Stage-by-stage build and proof, first tasks, gating experiments, proposed layout |

## Documents

| File | What it covers |
|---|---|
| `C1-literature-review.md` | Papers, Indian law and policy, and court AI systems (incl. SUPACE, LegRAA) that shape decisions |
| `C2-prior-art-repos-review.md` | Every repository used as input: what we take and where it fits |
| `C3-master-research-and-architecture.md` | How it is built: Windows Electron architecture, harness, Notebook, Studio, MOTO, verifier/eval agent, Jev/Clef, data model, roadmap; **authoritative decision register and stages** |
| `C4-master-product-plan.md` | What is built: modules W0–W14, MVP stages and acceptance, Commons surface, post-MVP |
| `C5-master-standards-and-ontology-plan.md` | Normative standards: ontology from SC/HC metadata, NVS/CVS/RTS, INSC resolver, manifest and receipt, grammar of proof, CT suites, Court proposal |

## Reading order

`product-scope.md` → C4 (what and MVP) → C3 (how) → C5 (the contract) → C1 and C2 as evidence when needed.

## Open items

1. **Final Regulations text** on notification vs the 03.06.2026 draft; re-issue the mapping (C3 U-01, C5 O-6).
2. **SC corpus profiling:** parquet field list, fill rates and semantics; coverage window and recent-judgment gap; upstream cadence (C3 U-03, C5 O-1, O-5).
3. **HC dataset metadata fields** per court (C5 O-2).
4. **Back-assigned INSC numbers:** official and stable? Compare ≥ 100 `nc_display` values (C3 U-02, C5 O-3).
5. **SC portal behaviour and terms:** CAPTCHA, download flow, result columns, listing completeness (C3 U-04, C5 O-4).
6. **Indian Kanoon API** pricing and limits for user-triggered fetches (C3 U-05).
7. **Docxodus WASM editing fidelity** in Electron (C3 U-06).
8. **SQLite page-encryption packaging on Windows** (C3 U-07).
9. **SC e-filing PDF technical limits** (C3 U-08).
10. **Clef context length** honoured per backend (needle tests) (C3 U-09, C5 O-7).
11. **Calibration of Clef, Clef-flash and Jev** on Indian legal entailment and treatment; local quantised Clef drift (C3 U-10, U-13, C5 O-8).
12. **Jev API terms:** retention, region, GA, before any matter text (C3 U-11, C5 O-9).
13. **OpenRouter Decisions API** exact path and per-provider retention (C3 U-12).
14. **BSA s.63(4) Part B:** who beyond s.79A examiners may sign (C3 U-14).
15. **Neutral namespace domain** for the standard, before ILO 0.1 freeze (C5 O-10).
16. **SC Registry defect list** for `ilo-vocab/defect`, via SCAORA members (C5 O-11).
17. **Advocate signing keys** for DSSE: workspace key vs DSC (C5 O-12).

Attribution for reused repositories and datasets is to be completed before public release.
