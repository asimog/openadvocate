# Working architecture

Discussion so far (31 Oct 2026). Locked vs open. Runs on the lawyer’s machine. Windows and Mac. No Docker, no WSL, no our cloud.

**Supersedes** `docs/architecture.md` and `docs/plan.md` where they differ: TypeScript/Node runtime, Electron shell, packages running in the React app. The TS code in `packages/`, `apps/cli` and `standard/codegen.ts` is ported to Rust and then removed. What carries over: the four layers and their owners, the ledger (§10), the ULOS JSON Schema (§11), the golden matter.

---

## Flow (as stated)

1. SLP comes in. Lawyer enters details. Optionally uploads files.
2. Capture the High Court record: browser we control, lawyer logs in and solves captcha, we download every artifact.
3. As each file lands, an ingest job: type → transcribe (OCR if needed) → record.
4. Notebook is the working copy of everything so far. Later Studio artifacts hang off it too.
5. Studio (separate system, same Notebook): research, memo, Q of law, drafting, adversarial review. Lawyer’s API keys. Our default prompts, overridable. Custom steps allowed. Output back into the Notebook. Studio never writes facts.
6. Draft SLP: Summary, Factual Matrix, Question of Law, Arguments, Annexure. Cites Notebook material from the previous case. Every cite verifiable. Same schema/ontology. Hand off to the lawyer.

**Factual Matrix** is chronology (what happened when, client and court specific). Schema. Not an LLM job. Every dated event in; lawyer can exclude a date or a type of date.

**Synopsis** is a view over that chronology. V1 from schema, not a model. Later LLM polish only if each sentence cites an event id.

---

## 1. Shell — locked for MVP

UI is a normal web app (screens + API). It does not know Electron vs browser vs later wrapper. Switch the shell, don’t rewrite screens.

**React SPA.** Talks **HTTP JSON** to the Rust process on localhost. Not Tauri commands, not IPC, not a Rust-in-the-browser UI (Leptos/Yew).

MVP/demo: open a browser tab at `http://127.0.0.1`. Installer and in-app court browser can wait.

Lawyer never installs Node, Python, Docker, WSL. Shipped product later is double-click `.exe` / `.dmg`. OCR and browser are binaries we bundle.

Court login for now: headed Chromium **we** launch and bundle, not their Chrome. Driven over CDP. Not Playwright’s Node driver. Not the app UI webview. Later the same flow can sit inside the GUI.

API keys: OS keychain / settings. Not in the matter folder.

---

## 2. Matter — locked

**One matter = this SLP.** Not the whole dispute.

**Client is optional.** Lawyer may type client details. One client → many matters. Same name ≠ same client (our id, never the name). After capture we may *suggest* parties from the cause title. We do not auto-create a client.

**Attachments:** app-owned folder + DB rows. On ingest we **copy** and name by hash. Their Downloads can vanish.

**Don’t lose the record**
- UI: no casual delete of a source. If delete exists: typed confirm, tombstone in DB, not a silent wipe.
- Disk: on open and on a watcher, every DB hash must exist. Missing or hash mismatch → alert, mark `missing`. Keep the DB row. Notebook text can remain; bytes are gone until re-import.

**Status is two layers, not one happy enum**
- **Phase:** intake → fetching → analyzing → notebook ready → studio → draft.
- **Problems:** list. Partial is normal (19 ok, 1 OCR fail).
- Job: `queued | running | done | failed | needs_review`. Failed is retryable. One bad file does not freeze the matter.
- Login abandoned ≠ “file 12 of 40 failed”.

---

## 3. Capture — locked

Two pipes, same folder + DB: **drop files** and **HC fetch**. Capture does not transcribe.

**HC fetch**
- Court site from **`matter.court`** → adapter → URL. Case number fills the form; it does not pick the site. Unknown court → don’t open a browser, ask.
- Dedicated Chromium, our profile, not their Chrome.
- Two modes, never mixed:
  - **Human:** login, captcha. We wait. They click Continue in **our** app.
  - **Robot:** we download. Don’t touch that window. Prefer file URLs over clicking around. If they use the window, abort and retry.
- One search hit: take it. Several: list in our UI, they pick.
- Outlook / their Chrome / Word is fine. Closing our window, navigating away inside it, or background captcha → job error, retry.
- We do not keep the HC password. Session dies when the window closes or we finish.
- One court adapter + a hard interface. First adapter: Delhi High Court. Next High Court = new adapter.

**Duplicates (three layers)**

| | What | When | Do |
|---|---|---|---|
| 1 | Same bytes (SHA-256) | Capture | One file on disk. Extra origin on the row. |
| 2 | Same listing (portal id, annexure no., order date + title) | Capture | Two files, **one document**. Linked. Keep both. |
| 3 | Same text after OCR (scan vs digital PDF) | After ingest | Suggest. Lawyer confirms. Never auto-merge. Never drop the certified scan. |

**Blob** = bytes. **Document** = the order/FIR/annexure. One document, many blobs.

---

## 4. Ingest jobs — locked

Per file, as it lands. Do not wait for the full download. Local only. No cloud OCR.

1. Type from bytes/MIME, not extension.
2. Route:
   - TXT/CSV → read text. No OCR.
   - PDF with text layer → pdfium + PP-OCR.
   - Scan / JPG / PNG → PP-OCR + Tesseract.
   - Unknown → fail, don’t guess.
3. Two engines, independent. Agree → line text. Disagree → empty line, `needs_review`.
4. Store transcription + page/line boxes + name + portal annexure label if Capture had one.
5. Soft category from portal label first (`order / FIR / annexure / unknown`). Content classification can wait.
6. Then near-dup (layer 3) as a warning.

Queue in SQLite. One or two workers on a laptop. Retry failed OCR.

Ingest does **not** invent parties or dates as facts. It stores the text of this file. Chronology comes later.

**OCR, bundled in the app (not pip, not Docker)**
- PP-OCR models on ONNX Runtime (what RapidOCR wraps) — called from Rust (`ort`), not Python
- Tesseract 5 + `eng` (best) — C library, Rust binds
- pdfium for the PDF text layer — C++, Rust binds

No EasyOCR / Surya / VLMs / cloud. Handwriting and dim stamps → flag, don’t pretend.

---

## 5. Notebook — in progress

The working record. Studio and the SLP read this, not raw files.

As each ingest job **done**, that source attaches. “Notebook ready” = no jobs queued/running, and review items resolved or explicitly skipped.

Ingest **commits into** the Notebook by appending ledger events (§10). The ledger is the truth; the Ladybug graph is built from it. Graph in meaning: file → page → line → event → claim → SLP paragraph.

Bytes stay files on disk. DB/graph stores the hash. Missing file = hash not on disk.

**Graph product — locked: LadybugDB**

Embedded Cypher. In-process (`lbug` crate). Native Windows + Mac. MIT. No JVM, no Docker, no port.

Ladybug is the community continuation of Kùzu (archived Oct 2025). If the fork stalls, on-disk files + Cypher are still movable.

Jobs / clients / matter list / file-hash vs disk stay **SQLite**. Notebook is the Ladybug graph.

Out: Neo4j (server/JVM/RAM/GPL), Memgraph (Docker/WSL on Windows), SurrealDB (not Cypher; we picked Cypher), CozoDB (stale), hand-rolled node/edge tables.

**One Ladybug graph per matter**, in the matter folder. Copy the folder, copy the case.

**V1 nodes** (ingest writes these)

| Node | Count for one 30-page PDF | Is |
|---|---|---|
| `Document` | 1 | The order / FIR / annexure. One document, many blobs. |
| `Source` | 1 (2 if a scan of the same order also exists) | One blob. PK = SHA-256. Bytes stay on disk. |
| `Page` | 30 | Page n of that source. |
| `Line` | ~1,000 | OCR row. Empty text if engines disagree. Cites land here. |
| `Extract` | dozens | Date / party / statute / case no. / amount / citation mention. Anchored on a line. |

**V1 edges:** `HAS_BLOB` (Document→Source), `HAS_PAGE`, `HAS_LINE`, `ANCHORED_ON` (Extract→Line), `SAME_AS` (Document→Document after a lawyer-confirmed near-dup, layer 3). A listing-dup (layer 2) is already one `Document` with two `HAS_BLOB` edges.

Checks are **fields on the extract**, not nodes. Bytes, jobs, keys are not in the graph.

Not in V1 (same graph later): Event, Claim, SLP paragraph, Judgment.

Cite path: Extract → Line → Page → Source.hash → file on disk.

Ledger = truth and audit log (who wrote what, §10). Ladybug = what Studio queries, rebuilt from the ledger. Lose the graph, replay the ledger.

---

## 6. Chronology (Factual Matrix) — locked so far

One timeline **per matter**, across every file. Not one timeline per PDF.

**Inputs:** date extracts from agreed lines only. NLP never runs on a disagreed (empty) line.

**How a date is read**

1. Regex first — Indian court forms: `12.03.2024`, `12th March, 2024`.
2. Relative and partial dates (`yesterday`, `Oct 25`, `on the night of…`): a Rust crate (`interim` / `chrono-english` candidates) plus our own rules for what they miss. Recognizers-Text is the behaviour we want, not the library (JS/.NET). Reference date = **that file’s header date**, never the laptop clock.
3. `timeOfDay` (`night` / morning / …) is a **flag on the extract**, not its own timeline row.
4. “Thereafter” / “subsequently” — no day. Stay text. Not events.

**Explicit vs inferred**

| | Example | Check | On the timeline |
|---|---|---|---|
| Explicit | `12.03.2024` in the quote, engines agreed | `checked` | normal row |
| Inferred | `yesterday` → 11.03.2024; `Oct 25` → year filled from header date | `inferred` | **highlighted** (“inferred”) |
| Unresolved | no document date to hang on; or `March 20` could be two years | `unresolved` | **not** on the matrix until the lawyer sets it |

**Human in the loop — locked**

Infer, then **do not trust**. Every inferred extract:

- stays on the timeline, visually marked
- sits in the same review list as OCR disagreements (`kind: date-inference`)
- is editable (year, day, time-of-day)
- Confirm = one click → `checked`. Edit then confirm also `checked`.
- Skip = stays off Studio/SLP; extract is not deleted

Studio and the SLP may cite **checked** dates only. Highlighted inferred rows are for the lawyer, not for generated prose.

Past-only year guess (header 12 Mar 2024 + `Oct 25` → 2023) is still `inferred`. Ambiguous (`March 20` vs a March order) is `unresolved`, not auto-filled.

Event nodes come later. V1 of the matrix is dated extracts, sorted, exclude-without-delete (one date or a whole type).

---

## 7. App language — locked: Rust

The product is a local Rust app. No Node, Python, Elixir, or Ruby as the runtime we ship.

| | |
|---|---|
| Ledger | Append-only SQLite, ported from `packages/core/src/ledger.ts` — §10 |
| Notebook | Ladybug via the **`lbug`** crate |
| Chamber / jobs | SQLite + **apalis** — §9 |
| Types | Generated from the ULOS JSON Schema with `typify` — §11 |
| Capture | Chromium **we bundle** + CDP (`chromiumoxide`, headed, our profile). App UI webview is not the court browser. |
| OCR | Same engines as §4: ONNX PP-OCR, Tesseract C, pdfium — from Rust, not pip |
| UI | React SPA over HTTP — §8 |
| Dates | Behaviour in §6 stands. Regex + `chrono`; relative-date crate not picked yet. |

Out as app language: TypeScript/Node, Python, Elixir, Ruby. Sidecars that drag those runtimes in are also out (no Playwright Node driver, no PyInstaller RapidOCR).

Node stays on the developer machine only: building the React SPA and running Playwright tests against it. Nothing Node ships to the lawyer.

---

## 8. Frontend — locked

```
Browser (MVP) / later webview
        │  HTTP JSON  127.0.0.1
        ▼
   Rust app
```

| | |
|---|---|
| Kind | **SPA** |
| Library | **React** |
| PDF / cites | **pdf.js** — open this file, this page, this box |
| API | **HTTP JSON** on localhost. Screens never import `lbug`, never spawn Chromium. |
| Types | Generated from the ULOS JSON Schema (`json-schema-to-typescript`) — §11 |
| Tests | Playwright, dev and CI only |

Out: Next.js, LiveView, Leptos/Yew/Dioxus, Tauri command bindings as the API, using the court Chromium as the app window.

---

## 9. Jobs — locked: apalis + SQLite

Queue is **rows in chamber SQLite**. Workers run **inside our Rust process**. MIT crate — we do not pay for apalis Pro (their board, DLQ SKU, payload encryption).

| | |
|---|---|
| Crate | **apalis** + **apalis-sqlite** |
| Kinds | `fetch` (Delhi HC Chromium run), `ingest` (one per file as it lands) |
| Status | `queued \| running \| done \| failed \| needs_review` |
| Workers | 1–2 on the laptop. OCR in `spawn_blocking` |
| Crash | `running` left behind → re-queue (apalis heartbeat / orphan recovery) |
| What we show | **Our** UI + our rows. Not apalis-board. Dev: `tracing` + job row |

Out: Redis/Sidekiq, Temporal, Sayiir, River, fang, a hand-rolled loop unless apalis is later dumped.

Failed is retryable. One bad PDF does not freeze the matter. Dead-letter = our `failed` rows, not their Pro DLQ.

---

## 10. Ledger — locked: Rust, the truth

The audit log and the store of truth. Ported from `packages/core/src/ledger.ts`, same rules.

- **Append-only.** Every change is one event (`source.added`, `extract.recorded`, `extract.reviewed`, `citation.verified`, …). Nothing is updated or deleted in place.
- **Ownership.** Each event type has owners (Notebook, verifier, Studio, lawyer, …). A write by anyone else is rejected, not logged. Studio cannot write a fact.
- **Hash chain.** Each event carries the hash of the one before. Change a past event and the chain breaks.
- **Validated.** Every event is checked against the ULOS schema (§11) when it is written.

Storage: `ledger.db` (SQLite) in the matter folder, beside `sources/` and the Ladybug graph. Copy the folder, copy the case.

Write order: ledger first, then the graph. The graph remembers the last ledger `seq` it applied; on open or after a crash it replays from there. No write ever spans both stores.

Receipts and the registry check (`docs/architecture.md`) verify this chain.

---

## 11. Schema — locked: JSON Schema is the source

`standard/schemas/ulos.schema.json` stays the one source. It is the public standard (Product 2), so it stays language-neutral.

| | |
|---|---|
| Rust types | `typify`, generated at build time |
| React types | `json-schema-to-typescript` |
| CI | Fails if generated types are stale |

No protobuf: the API is HTTP JSON and nothing needs a binary format. A second schema language would only drift.

---

## Not discussed yet (continue from here)

- Studio (keys, prompts, custom steps) as a system
- Citation verification
- SLP composer
- Ontology as the write contract (which events, which owners — beyond the port)
- Relative-date crate on Rust (Recognizers-class behaviour)
- Localhost API security: `Host` / `Origin` check, per-launch token, no permissive CORS
- Hindi and mixed-script records (Tesseract `hin`, multilingual PP-OCR)
- SQLite size per matter (ledger + lines) — check against a large real record
