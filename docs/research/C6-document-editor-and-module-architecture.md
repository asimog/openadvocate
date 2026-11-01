# C6. Document editor, Harvey review and updateable module architecture

Status: research and recommendation. No code changed. Date: 2026-11-01.

Tags: **[V]** verified (repo inspected or primary source read), **[S]** stated by vendor/README, not tested by us, **[I]** inference, **[R]** recommendation.

## 1. Current repository truth

The repository is named Vakilbench (Open Advocate is the product discussion name). Inspected at `6ac2def`.

| Responsibility | Owner today | State |
|---|---|---|
| App shell, window lifecycle | `apps/workspace` (React + Vite, runs packages in-process) | **Implemented as web app only.** Electron shell is Phase 5 in `docs/plan.md` [V] |
| Canonical state | `packages/core` `Ledger`, append-only, hash-chained, `OWNERS` table enforces which actor kind may write each event type | **Implemented, in memory.** SQLite is Phase 5 [V] |
| Document identity, storage | `source.added` events; bytes by SHA-256 in `sources/` (per `docs/architecture.md`) | **Partially**: identity by hash exists; on-disk store not built. No *revision* or *draft document* event type exists [V] |
| Matter | `packages/matter` composes views from the ledger | Implemented [V] |
| Permissions | `OWNERS` per event type, by actor kind (`lawyer`, `notebook`, `verifier`, `studio`, `moto`, `pleading`, `court`) | Implemented. No capability system for modules [V] |
| Module discovery/install/lifecycle | **None.** Packages are pnpm workspace deps compiled into the app | Absent [V] |
| Updater | electron-updater planned (C2, plan Phase 5) | Proposed [V] |
| Agent execution | Studio/MOTO propose `claim.proposed`; model provider planned (Phase 4) | Partial [V] |
| Provenance, audit | Ledger events + signed receipts (`receipt.ts`, `apps/cli/src/ulos.ts`) | Implemented [V] |
| Editor | **Historical decision D19: Docxodus in-app editor**, agent edits only as tracked changes authored `Agent:<role>:<run_id>`, revision→run map in ledger, gated on a Stage 3 spike over 30 SC-format DOCX files (C2 §9) | Proposed, spike not run [V] |
| Drafting today | The SLP is a state machine (`packages/pleading`); no DOCX output in code (`grep docx` empty) | Absent [V] |

Consequence: there is no existing plugin system, updater or document store to duplicate, but there *is* an authority owner (the ledger) and an editor decision (D19). This assessment builds on both.

## 2. Harvey review (litigation-relevant only)

| Finding | Tag | Source | Lesson / reuse |
|---|---|---|---|
| Word add-in Edit mode redlines selection or whole document as tracked changes; Draft mode creates new text | [S] | [help.harvey.ai/articles/harvey-for-word](https://help.harvey.ai/articles/harvey-for-word) | **Reuse**: AI output is a tracked change, never a silent overwrite |
| Suggestions are reviewed and accepted/dismissed individually before insertion; preview of redlines added mid-2025 | [S] | same; [The Brief July 2025](https://www.harvey.ai/en-US/blog/the-brief-july-2025) | **Reuse**: proposal ≠ applied change |
| Add-in edits through Office.js ranges, paragraphs, tables and content controls "to avoid corrupting the markup"; model does not emit XML | [S] | [Enabling document-wide edits](https://www.harvey.ai/en-US/blog/enabling-document-wide-edits-in-harveys-word-add-in) | **Reuse strongly**: model edits a text projection; deterministic code maps edits back. Matches our "no raw OOXML from the model" constraint |
| Existing tracked changes shown to model as `<ins>`/`<del>`; insertions placed relative to existing elements, formatting inferred from neighbours and style parts | [S] | same | **Adapt**: anchor-addressed operations (Docxodus `DocxSession` anchors) |
| Long documents: orchestrator reads whole doc, plans, dispatches bounded-section subagents, propagates global constraints (defined terms, cross-refs) | [S] | same | **Adapt** for 100+ page SLPs with annexures |
| Users told not to edit while Harvey is "thinking" | [S] | help article | **Reject** this weakness: our edits bind to a base revision hash and are rebased or rejected, not raced |
| Web Draft editor exports redlines to Word as tracked changes, first-to-latest version | [S] | help article | Version-to-version compare is a core feature |
| Editor framework / document engine of the web Draft editor | **Not public** | — | Do not infer |
| Custom agents run inside Word; Vault holds matter-wide document sets with source-linked answers | [S] | [run custom agents in Word](https://www.harvey.ai/blog/run-custom-harvey-agents-in-microsoft-word) | Our equivalents already exist as owners: Notebook (record), citation verifier, Studio. Harvey's lesson is *surfaces*, not new owners |

Harvey's architectural lesson: **Word stays the editor of record for many lawyers; the AI layer is a proposal engine that writes tracked changes through a structured API.** Open Advocate should not out-Word Word; it should own the matter and the evidence chain and make edits reversible everywhere.

## 3. Candidate comparison

No round-trip test (§4) was executed in this task. Everything below is source/licence inspection.

| Candidate | What it is | DOCX approach | Licence | Fit | Verdict |
|---|---|---|---|---|---|
| **Docxodus** ([JSv4/Docxodus](https://github.com/JSv4/Docxodus)) | .NET engine compiled to WASM (npm `docxodus`), browser `DocxEditor` with ribbon, page view, header/footer editing; compare, accept/reject, `DocxSession` tracked edits | Operates on OOXML through Open XML SDK; compare round-trip contract accept(compare(L,R))≡R [S] | MIT (+CLA) [V] | Runs in renderer or worker, no second shell, no server | **Engine: adopt (already D19). Editor UI: spike** — WYSIWYG fidelity unproven |
| **GenOffice** ([genspark-ai/genoffice](https://github.com/genspark-ai/genoffice)) | Seven Electron apps; Docs = Tiptap/ProseMirror over a block tree anchored to original XML; dirty blocks spliced, other zip entries byte-copied; paginates on Word line metrics, HarfBuzz for complex scripts | Passthrough preservation [S] | Apache-2.0 except `ee/`; names/logos trademarked [S] | Its own Electron shell(s); Genspark sign-in/proxy optional (BYO key supported) | **Adapt pieces, not the app.** Pagination/HarfBuzz and the block-anchor UI are worth studying. Passthrough ≠ compatibility; no published fidelity benchmarks; described as alpha in places |
| **ONLYOFFICE** | Mature editor (Document Server + Desktop Editors), strong DOCX, track changes, compare | Own internal format, converts DOCX [I] | AGPLv3 + Section 7 logo terms (disputed, see Euro-Office 2026); Developer Edition is commercial and centred on Document Server, desktop on request [S] | Embedding needs a local Document Server or their desktop shell — a second runtime/shell | **Reject as default**; licence + second runtime. Keep as fallback if fidelity spike fails and a commercial licence is bought |
| **LibreOffice Writer** | Most complete open engine; UNO automation; headless conversion | Native DOCX filter, known gaps on complex numbering/fields [I] | MPL-2.0 [V general knowledge] | No supported embedding into Electron; LibreOfficeKit exists but is a C API | **Use headless only**: PDF export and second compare oracle (already in C2) |
| **Collabora** | LibreOffice core served over the browser (COOL), WOPI | As LibreOffice | MPL core, commercial support | Needs a local server (Linux-centric; Windows via container) | **Reject for MVP** on Windows-first, local-first grounds; WOPI lock semantics worth copying |
| **OpenContracts** ([Open-Source-Legal/OpenContracts](https://github.com/Open-Source-Legal/OpenContracts)) | Django/React/Celery/Postgres annotation platform; PAWLS coordinates; uses Docxodus for DOCX | Annotation over rendered text, no content editing [S] | MIT [S] | Server stack; overlaps Notebook | **Not an editor.** Borrow its annotation/relationship data model ideas for Notebook; do not adopt the stack |
| Others: SuperDoc, docx-preview, docx.js | Lighter DOCX viewers/generators | — | various | — | docx.js already "optional" in C2 for template generation. SuperDoc (AGPL/commercial) worth one look in the spike [I] |

## 4. Litigation editor requirements and test protocol

Required (MVP gate): DOCX in/out; page layout, page/section breaks, headers/footers, page numbers; styles; multilevel and legal paragraph numbering; footnotes; tables spanning pages; images; comments; Track Changes with accept/reject; compare/redline; PDF export; 300+ page documents; Devanagari/Hindi with Unicode fonts (Mangal, Nirmala UI, Kokila); bidirectional Word compatibility.
Deferred but must survive untouched: TOC and fields, cross-references, endnotes, content controls, SDT-based templates.

**Corpus**: 30 representative Supreme Court documents (SLP with synopsis and list of dates, index of annexures, affidavits, vakalatnama, I.A.s, a Hindi-script annexure, a 300-page paper book), per C2's existing spike scope.

**Round-trip test (per document, per candidate)**: open → edit (one paragraph, one numbered item insert, one table row, one comment, one tracked change) → save → open in Word → edit in Word with Track Changes → save → reopen in candidate → compare:
1. OOXML diff of untouched parts (byte-equal expected).
2. Numbering: `numbering.xml` abstractNum/num IDs and rendered labels.
3. Revisions: `w:ins`/`w:del`/`w:pPrChange` count and authors.
4. Rendered PDF via Word vs candidate: page count equal, per-page visual diff below threshold.
5. Open XML SDK schema validation clean.

A feature is "supported" only if all five pass; "preserved" if 1 and 5 pass but it cannot be edited; else "unsupported" and must be reported to the user on open (§5).

## 5. Recommended editor architecture [R]

Two packages, not five. Boundaries justified by independent release cadence and dependency weight:

| Package | Owns | Why separate |
|---|---|---|
| `@vakilbench/docx-engine` | Docxodus WASM wrapper: parse, anchor projection, apply operations, compare, accept/reject, feature inventory, render-to-HTML | Large binary (WASM), upstream-pinned, needs its own compatibility test corpus; reused headless by Notebook and by the registry check |
| `@vakilbench/editor` | Editor panel UI, sessions, review pane (redline/compare is a view, not a package) | UI release cadence differs from engine |

Word integration is a third optional module only if built (§7). No format-specific engines until a second format is needed.

Kernel stays the ledger plus `sources/`. The editor never writes files or events directly. New event types, owned as shown (extend `OWNERS`):

| Event | Body | Writer |
|---|---|---|
| `draft.created` | draftId, title, template or base sourceHash | lawyer |
| `revision.committed` | draftId, revisionHash (bytes stored by hash), parentRevision, operations summary, featureReport | lawyer (editor submits, lawyer action commits) |
| `edit.proposed` | draftId, baseRevision, operations[], runId, groundedIn[] | studio, moto |
| `edit.decided` | proposalId, accepted opIds, rejected opIds | lawyer |

Originals (`source.added`) are never targets; a draft from a pleading starts as `draft.created` with `base = sourceHash`.

### Editor ↔ host interface (typed, in-process call through a host object; not filesystem)

```ts
interface EditorHost {
  openDraft(draftId): Promise<{ meta: DraftMeta; head: RevisionRef; bytes: Uint8Array }>;
  beginSession(draftId, head: RevisionRef): Promise<SessionToken>;        // advisory lock per matter window
  commitRevision(t: SessionToken, bytes, parent: RevisionRef, ops: OpSummary, report: FeatureReport)
    : Promise<{ ok: true; rev: RevisionRef } | { ok: false; reason: 'stale-parent' | 'denied' | 'invalid-docx' }>;
  listProposals(draftId): Promise<EditProposal[]>;
  decide(proposalId, accepted: OpId[], rejected: OpId[]): Promise<void>;   // records lawyer decision
  context(anchor): Promise<SourceLinkedContext>;                           // extracts/verified citations only
  exportFile(rev, format: 'docx' | 'pdf'): Promise<ExportRef>;             // host writes; user picks path
  compare(a: RevisionRef, b: RevisionRef): Promise<Uint8Array>;            // redline DOCX
  onHeadChanged(draftId, cb): Unsubscribe;
}
```

Semantics:
- **Revisions** are immutable, content-addressed; head = latest `revision.committed`. Autosave writes a local recovery file in the editor's scratch area, never a revision.
- **Concurrency**: one writable session per draft; second window opens read-only. `commitRevision` with a stale parent fails; editor offers compare-and-merge (Docxodus compare of parent→head and parent→local).
- **Failure/recovery**: crash → on reopen, recovery file is diffed against head and offered as a pending revision.
- **Permissions**: host checks actor kind against `OWNERS` before append; editor module holds no ledger reference.
- **Unsupported features**: engine returns a `FeatureReport` on open (e.g. "3 fields, 1 SmartArt: preserved, not editable"); editing inside such regions is blocked and the report is stored with each revision.

## 6. Module/package and update lifecycle [R]

No module host exists, so this is new, but it must be **one** mechanism and small. Do not build a marketplace.

**Manifest** (`oa-module.json`): `id`, `version` (semver), `hostApi` (semver range of `EditorHost`/host API), `platforms`, `dependencies` (module ids + ranges), `kind` (`ui-panel` | `engine` | `workflow` | `skill-pack` | `knowledge-pack` | `agent-tool` | `integration`), `capabilities` requested (e.g. `draft.read`, `draft.commit`, `edit.propose`, `network:none`), `entry`, `integrity` (SHA-256 of payload), `signature` (Ed25519 over manifest, key from a pinned publisher list — reuse the key/receipt code in `packages/core`).

**Lifecycle**: discover (bundled channel file or offline `.oamod` zip) → verify signature and hashes → check `hostApi` and deps → stage to `modules/<id>/<version>/` → activate by switching a single pointer file atomically → keep previous version → on failed health check (load + engine self-test on a fixture) roll back pointer. Updates install while a session is open but activate at next session open of that panel; engine updates require the panel to reload, never the app.

**Owner**: the Electron main process (Phase 5) owns this as part of the shell, beside electron-updater. The app updater updates the shell; the module loader updates modules. Same signing keys, same verifier code — not a second authority.

**Isolation**: first-party UI modules run in the renderer with only the `EditorHost` object; engines run in a Web Worker (WASM); third-party modules are out of scope until needed, and then run in a separate utility process with capability-checked IPC. IPC/JSON-RPC is a boundary, not a sandbox; the sandbox is the process plus Electron `sandbox: true` and no Node integration.

**API evolution**: host API is versioned; host supports current and previous major; a module declaring an unsupported range is not activated (old version kept). Only one version of a module is active per install. Engines never migrate stored documents: revisions are plain DOCX bytes, so a module update cannot rewrite documents.

## 7. Microsoft Word integration

| Path | What it actually is | Assessment |
|---|---|---|
| Office.js Word add-in | Task pane inside the user's Word; edits through Word JS API | **Supported, Harvey's path.** Add-in needs a manifest and an HTTPS origin; can be served from localhost with a trusted cert and sideloaded [I]. Works with user's own licence |
| COM automation | Drives a separate Word window/process from the host | Supported on desktop; open/save/compare/print; not UI embedding |
| OLE / DSOFramer in-place activation | Legacy ActiveX hosting | DSOFramer withdrawn by Microsoft before Office 2010 ([Stack Overflow archive](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/13468523/how-to-embed-microsoft-office-in-win-form)) |
| Win32 `SetParent` into Electron | Reparenting Word's window | Microsoft: "not a supported scenario … we do not recommend it" ([MS blog](https://learn.microsoft.com/en-us/archive/blogs/johnrdurant/host-word-in-winform-application)). Expect focus, DPI, dialog, ribbon and crash issues [I] |

Full Word UI embedding in the workbench is **not supported**. Smallest reliable strategy [R]: "Open in Word" — host exports the head revision to a working copy, launches Word on it (shell open or COM), watches for save, and re-ingests as a new `revision.committed` after compare against the exported parent (WOPI-style lock/timestamp semantics). An Office.js add-in exposing proposals and verified citations is phase-later.

## 8. AI editing flow [R]

1. Studio/MOTO receives a text projection of the draft (Docxodus anchors, existing revisions as `<ins>/<del>`), never XML.
2. Model returns structured operations: `replaceText(anchor, from, to)`, `insertParagraphAfter(anchor, text, styleHint)`, `insertCitation(anchor, citationId)`, `deleteRange`, `insertAnnexureEntry`. Long documents use orchestrator + bounded-section workers (Harvey pattern).
3. Validation: anchors exist at `baseRevision`; `insertCitation` only for citations with all four levels `verified` (existing rule); ops touching unsupported regions rejected. Result → `edit.proposed`.
4. Editor applies proposal **as tracked changes authored `Agent:<role>:<runId>`** in a preview; lawyer accepts/rejects per op → `edit.decided`.
5. Lawyer commits → `revision.committed`. Four distinct states: proposal, editor-applied preview, lawyer-approved, kernel-committed.

Blank drafts and annexure indexes are generated from templates as DOCX via the engine (docx.js optional), then edited as above. Alternative drafts = two drafts compared with `compare`.

## 9. Alternatives

| | A GenOffice | B ONLYOFFICE | C LibreOffice/Collabora | D Custom on Docxodus | E Hybrid (D + Open-in-Word) |
|---|---|---|---|---|---|
| Fidelity today | Unknown, alpha | High [S] | High engine, poor embedding | Unknown (spike) | Word covers any gap |
| Architecture fit | Brings its own Electron apps | Second runtime | Server/C API | Native, in-process | Native |
| Licence | Apache + trademarks | AGPL + logo / commercial | MPL | MIT | MIT + user's Word |
| Updateable as module | Hard (app-shaped) | Hard | Hard | Yes | Yes |
| Control | Low | Low | Medium | High | High |
| Cost | Medium (extraction) | Low code, high legal | High | High UI work | D + small |

## 10. Recommendation

**Option E**: Docxodus-based first-party editor module (engine + UI, two packages) with "Open in Word" round-trip as the guaranteed escape hatch. This keeps D19, keeps the ledger authoritative, and accepts that our in-app editor need not match Word on day one because every gap has a supported path back through Word with compare-on-return.

Limitations: Docxodus WYSIWYG and pagination fidelity on Indian SC documents is unproven; Hindi shaping in its HTML renderer is unverified; WASM size and 300-page performance unknown. If the spike fails on numbering or pagination, study GenOffice's pagination/HarfBuzz approach before considering ONLYOFFICE commercial.

Unresolved: whether drafts should live in the same ledger as the record layer or a sibling draft ledger per matter; Office.js add-in hosting from localhost on locked-down chambers machines; who signs third-party modules (defer).

## 11. Verification plan

1. Source: clone Docxodus and GenOffice at pinned commits; read engine tests (`Docxodus.Tests`, GenOffice `packages/*` vitest), list what fixtures cover numbering, footnotes, revisions, complex scripts.
2. Execute: run both suites locally on Windows.
3. Compatibility: §4 protocol on the 30-document corpus for Docxodus editor, GenOffice Docs, and Word as baseline; record per-feature supported/preserved/unsupported.
4. Performance: open and edit a 300-page paper book; time to first page, memory, save time.
5. Module: prototype manifest + signature verify + pointer swap + rollback with a dummy module (after Electron shell exists).

## Proposed ADR

**ADR-0xx: Drafting editor as a module over the ledger**

- **Context.** Advocates must draft and redline Word-compatible pleadings. No editor, module system or revision events exist. D19 chose Docxodus; full Word embedding is unsupported by Microsoft.
- **Decision.** Ship drafting as two first-party modules (`docx-engine`, `editor`) loaded by the Electron shell's module loader through a typed `EditorHost`. Drafts and revisions are new ledger events; bytes are content-addressed sources. AI edits are structured operations applied as tracked changes and committed only by the lawyer. "Open in Word" is the supported external path.
- **Alternatives.** GenOffice, ONLYOFFICE, LibreOffice/Collabora, Word embedding (§9, §7).
- **Consequences.** New event types and owners; shell gains a small signed module loader; editor fidelity depends on a spike.
- **Invariants.** Ledger is the only authority; originals immutable; no module writes files or events directly; model never emits OOXML; a citation inserted by AI must be fully verified.
- **Verification.** §11 steps 3–5.
- **Status.** Proposed, blocked on the fidelity spike.

## Final assessment: **ADOPT WITH LIMITATIONS**

1. The problem is real: there is no drafting surface, and pleadings leave the product as DOCX.
2. The architecture is correct in shape; editor fidelity is the open risk.
3. Authoritative owners stay: ledger (`packages/core`) for identity, revisions, permissions and provenance; Notebook and citation verifier for context; Pleading for procedure.
4. Reuse: Docxodus (engine, compare, tracked edits), existing receipt/key code for module signatures, electron-updater for the shell, Word itself for fidelity gaps.
5. Yes: modules are files under a pointer the shell already owns; no second authority or lifecycle.
6. Unverified: every DOCX fidelity claim for every candidate; Harvey internals; Office.js localhost hosting.
7. **Single best next task: run the §4 round-trip spike for the Docxodus editor on the 30-document SC corpus, with Word as baseline.**

## Sources

- Harvey: [Harvey for Word](https://help.harvey.ai/articles/harvey-for-word), [Enabling document-wide edits](https://www.harvey.ai/en-US/blog/enabling-document-wide-edits-in-harveys-word-add-in), [Custom agents in Word](https://www.harvey.ai/blog/run-custom-harvey-agents-in-microsoft-word), [The Brief July 2025](https://www.harvey.ai/en-US/blog/the-brief-july-2025)
- [GenOffice](https://github.com/genspark-ai/genoffice), [Docxodus](https://github.com/JSv4/Docxodus), [OpenContracts](https://github.com/Open-Source-Legal/OpenContracts)
- ONLYOFFICE: [Licence FAQ](https://www.onlyoffice.com/license-faq), [Euro-Office dispute](https://onlyoffice.com/blog/2026/03/onlyoffice-flags-license-violations-in-euro-office-project-by-nextcloud-and-ionos), [Developer Edition](https://www.componentsource.com/product/onlyoffice-docs-developer/about)
- Word hosting: [Host Word in WinForms (Microsoft)](https://learn.microsoft.com/en-us/archive/blogs/johnrdurant/host-word-in-winform-application)
