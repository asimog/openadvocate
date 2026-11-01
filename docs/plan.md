# Implementation Plan

Scaffold first: the standard, the core and a GUI test harness exist before any feature. Then each layer is built bottom-up, and each phase ends with a Playwright run of the golden matter GM-01 in the GUI plus the evaluation agent's report.

## Phase 0. Standard, core, scaffold

- ULOS JSON Schema and ontology. Types generated from the schema, with a CI check that they are current.
- Ledger that validates every event against the schema and enforces write ownership.
- Hashing, receipts, citation grammar and the Jev/Clef port, all isomorphic (same code in the GUI and the CLI).
- Workspace GUI shell with panels and a Playwright test. CI on Windows and Linux.

**Done when** malformed records and wrong-owner writes are rejected, and the GUI loads GM-01 in a Playwright test.

## Phase 1. Notebook and simulated court data

- Two-engine text layers, deterministic extractors, the five extract checks, review.
- Simulated Supreme Court: judgment corpus, three source tiers, case-record repository, GM-01.
- Evaluation agent: Notebook suite.

**Done when**, in the GUI, every GM-01 extract shows its anchored line; the planted OCR disagreement and the planted wrong date are not `checked`; the evaluation agent's Notebook report passes.

## Phase 2. Citation verifier

- Four-level verification over the three tiers, with Jev/Clef as second opinion on support.
- Citation audit card in the GUI.
- Evaluation agent: citation suite.

**Done when** GM-01's planted cases come out right: wrong pinpoint `failed`, counsel's submission cited as holding `failed`, overruled authority `failed` on standing, the judgment missing from the corpus snapshot resolved at `sc-official`, and an unknown citation `unresolved`.

## Phase 3. SLP state machine and defect checker

- The machine in [slp.md](slp.md) with guards over the record and verdicts.
- Supreme Court defect rules pack, each rule confirmed against the rule text.
- Simulated registry that files, checks defects and verifies the receipt.

**Done when** GM-01 cannot advance past `authorities` while a citation fails, and the registry returns the planted defect, then a diary number after the cure.

## Phase 4. Research & Argument Studio, MOTO, Case Conference

- Research over the verified record and corpus.
- Studio proposals and MOTO argument expansion through a model provider (OpenRouter or local).
- Case Conference panel. Grounds filled only from accepted claims.

**Done when** a MOTO claim grounded in a failed citation never reaches the inbox, and the SLP reaches `compliance` only through accepted claims.

## Phase 5. Persistence, real OCR, desktop

- SQLite ledger and content-addressed sources.
- OCR sidecar with two engines on real scans.
- Electron shell, signed Windows installer, auto-update. Same GUI, same Playwright tests.

## Phase 6. Real sources and release

- AWS Open Data Supreme Court corpus as the `corpus` tier. Supreme Court portal capture in the built-in browser. Indian Kanoon adapter.
- Held-out matter GM-02 run by an advocate outside the team.
- Signed public release.

## Deferred

- Product 3 (commercial).
- High Courts, regional languages, macOS and Linux.
