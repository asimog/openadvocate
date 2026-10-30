# Implementation Plan

Build the verification core first, because every later phase stands on it. Then add producers of claims one kind at a time. The desktop app is a client of the core, not its foundation.

Each phase ends with a check that runs in CI.

## Phase 0. Core and scaffold (done)

- pnpm workspace, TypeScript, Node's built-in test runner, CI on Windows and Linux.
- `packages/core`: the six shapes, canonical hashing, ledger with chain verification, kernel, gate registry, derived status, signed receipts.
- `apps/cli`: `ilac verify`.

**Done when** `pnpm test` proves: a quote missing from its source fails; agents cannot decide; editing a claim resets it to pending; a dependent of a failed claim is blocked; a receipt refuses unverified claims and catches a changed document byte.

## Phase 1. Persistence and sources

- Store the ledger in SQLite (`node:sqlite`) and sources in a content-addressed folder.
- Ingest: PDF and DOCX to page text. OCR for scans.
- Rebuild the view from disk on open.

**Done when** a matter survives a kill mid-write with no duplicate or missing events, and its chain verifies after reopen.

## Phase 2. Desktop shell

- Electron app, signed Windows installer, auto-update.
- Matter list, document viewer with anchors highlighted, review queue.
- Model key stored in Windows Credential Manager.

**Done when** a clean Windows machine installs the app, opens a matter, and shows each claim's status from the ledger.

## Phase 3. Facts (the Notebook)

- An extraction agent proposes `fact` claims with anchors.
- Gates for dates and parties.
- Advocate accepts or rejects in the review queue.
- Anchored Q&A that answers only from verified facts.

**Done when** planted fabricated facts, unanchored facts and allegations typed as facts never reach `verified`.

## Phase 4. Citations, drafting and export

- Citation parser and resolver: Supreme Court site (via the built-in browser), the AWS open judgments corpus, then Indian Kanoon.
- Gates: resolves to one judgment, pinpoint paragraph exists, quote matches.
- DOCX editor with AI edits as tracked changes.
- Export: DOCX, PDF/A, receipt, AI-use declaration.

**Done when** a planted wrong pinpoint fails, an out-of-corpus citation is `unresolved` (never `failed`), and `ilac verify` passes on a second machine.

## Phase 5. Research and arguments

- `treatment` claims between citations, with the bench-strength gate for "overruled".
- Statute versions by date (IPC to BNS on 1 July 2024).
- An argument agent (MOTO) proposes `argument` claims that depend on verified facts and citations.

**Done when** no "overruled" appears without an anchor and bench check, and no argument with a failed dependency reaches the advocate.

## Phase 6. Release

- Full end-to-end run on a held-out matter by an advocate outside the team.
- Signed public Windows release.

## Deferred from the research docs

These are good ideas that do not change the foundation. Add them when a phase needs them.

- AI scoring models for routing (Jev/Clef). Add as an optional ranking on top of gates in Phase 3.
- A separate evaluation agent and held-out test sets. Start in Phase 3, when there is AI output to measure.
- Durable workflow journal, outbox, playbook interpreter. Not needed until agents run multi-step jobs.
- Generated JSON Schemas and an ontology. The TypeScript types are the schema until an outside implementer needs one.
- Defect checker, paper books, Case Conference. After Phase 5.
