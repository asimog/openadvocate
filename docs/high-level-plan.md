# High-level plan

What we build first. Locks live in `working-architecture.md` and `advocate-flow.md`. This is order, not tickets.

---

## Product for MVP

A local app on the lawyer’s machine (Windows and Mac). No Docker, no WSL, no our cloud.

**Done when:** a Delhi HC matter is captured (or files are dropped), ingested, and the lawyer can read a **Factual Matrix** — chronology, exclude without delete, cites stay on the extract.

Not MVP: Studio, draft SLP, citation verification, other High Courts, installer, in-app court browser.

---

## Court 1

**Delhi High Court only.** Login and captcha: the lawyer, in Chromium we bundle. We do not bypass.

---

## Order of work

```
Matter in
    │  optional: drop files  ←  enough to prove ingest without the scraper
    ▼
Capture Delhi HC record     ←  fetch job (apalis)
    │  as each file lands
    ▼
Ingest                      ←  ingest job: type → transcribe → dual-write
    ▼
Review (OCR / dates)        ←  needs_review; lawyer confirms
    ▼
Factual Matrix              ←  MVP output
```

Studio and SLP wait until the matrix is real.

---

## Write order (ingest)

No write spans two stores. The ledger is the truth (`working-architecture.md` §10).

1. **Ledger** (`ledger.db`, per matter): append the ingest events in one SQLite transaction. If that fails, the job fails.
2. **Ladybug**: applies the new events. It records the last ledger `seq` applied; on open or after a crash it replays from there. A graph failure never loses data — replay fixes it.
3. **Chamber SQLite**: job status (`done` / `failed` / `needs_review`). Job status is about the work, not the record.

A re-run job is safe: sources are keyed by hash, so the same file does not add a second record.

---

## Stack (already locked)

| | |
|---|---|
| App | Rust |
| UI | React SPA, HTTP JSON, `127.0.0.1` |
| Chamber / jobs | SQLite + **apalis** (`fetch`, `ingest`) |
| Notebook | Ladybug (`lbug`), one graph per matter |
| Capture | Bundled Chromium + CDP |
| OCR | ONNX PP-OCR, Tesseract C, pdfium — from Rust |

---

## Phases

**0. Shell + matter.** React SPA talks to Rust. Create a matter. App-owned files, hash names. Drop a PDF. Job row appears.

**1. Ingest.** apalis worker: detect type, transcribe, dual-write, `needs_review` when OCR/dates are inferred. Review screen.

**2. Factual Matrix.** Dated extracts, sorted, exclude without delete. Drop-files path is a valid demo.

**3. Delhi HC fetch.** Headed Chromium, lawyer login/captcha, download every artifact, enqueue ingest per file.

**4. Later (not this pass).** Studio (keys, prompts, custom steps). SLP composer. Citation verification. Other courts. Date crate on Rust. Installer / webview.

---

## Explicitly later

- Studio never writes facts
- Synopsis v1 is a view over the matrix, not an LLM
- Don’t lose the record: tombstone, missing-hash alert
