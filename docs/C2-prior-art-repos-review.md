# C2 — Prior-Art Repositories Review

**Every repository reviewed so far, as usable input to the Vakilbench Windows MVP.** For each: what we take and where it fits. Companion documents: `C1-literature-review.md` (papers and policy), `C3-master-research-and-architecture.md` (architecture, decision register D1–D35, stages), `C4-master-product-plan.md` (modules), `C5-master-standards-and-ontology-plan.md` (standards and ontology).

**MVP context.** Electron app on Windows (signed NSIS installer via electron-builder, auto-update via electron-updater), complete harness source open, one workspace per matter, built-in Chromium browser, built-in Docxodus editor, BYO OpenRouter key or local OpenAI-compatible model, SQLite journal and hash-chained ledger (D3, D5, D8, D18). TypeScript everywhere; Python only as a sidecar for OCR/layout and eval workers (D2). All repositories are usable inputs (D30).

**Modules (C3 register):** W0 shell, installer and model access · W1 matters · W2 documents & evidence · W3 Notebook & case graph · W4 research & drafting agents · W5 citation verifier (CVS) · W6 defect checker · W7 built-in browser · W8 editor · W9 ledger & manifest export · W10 review UI · W11 Research & Argument Studio (research layer, precedent graph, Case Conference) · W12 MOTO hypothesis engine · W13 Verifier/Eval agent · W14 Jev/Clef decision scoring.

**How we use a repository:** **Dependency** (shipped, pinned) · **Wrap** (sidecar behind our port) · **Extract** (copy specific files) · **Reimplement** (our own code from its design) · **Reference** (read for design) · **Optional** (user-installed or separate process) · **P1** (gateway/server phase after MVP).

Labels: **[S]** source inspected (commit noted where recorded, late Oct 2026) · **[F]** fact from a primary page · **[U]** not yet inspected.

**Attribution:** to be completed before public release.

---

## 1. Summary: where each area's inputs come from

| Area | Main inputs | Module |
|---|---|---|
| Shell, installer, IPC | Electron, electron-builder, electron-updater, `@electron/fuses`; OpenCode client/server split; Theia and code-oss layout ideas | W0 |
| Built-in browser and capture | Electron `WebContentsView` + sessions; CEF as reference | W7 |
| Harness core | Own TypeScript loop; OpenCode, Pi, Cordis/DeepSeek Harness, OpenAI Agents JS (fallback), AI SDK interface | W0, W4 |
| Model access | OpenRouter adapter (chat + Decisions API); local OpenAI-compatible endpoint (Ollama, llama.cpp, vLLM, SGLang `/v1/systemone`) | W0, W14 |
| Durability and ledger | Own SQLite journal and hash chain; RFC 8785, in-toto/DSSE, C2SP; Temporal/DBOS/Restate/Inngest/Trigger.dev/Hatchet as journal design references | W0, W9 |
| Storage and retrieval | SQLite, FTS5, sqlite-vec, DuckDB, BGE-M3 class embeddings | W2, W3, W11 |
| Ingest, OCR, anchors | Docling, pypdfium2, pdfplumber, Tesseract, PaddleOCR, OpenContracts/PAWLS, dsh-legal-dashboard classifier | W2 |
| Notebook and NVS | mootloop gate and ledger, ChronosAI chronology, stella decision-reader, new-litigation-visualization renderer principle | W3 |
| Citation verification | Own INSC parser and resolver; eyecite; CiteSight, CaseCite; vanga corpus; Indian Kanoon | W5 |
| Defect checking | Registry practice rules (ours); dsh-legal-work-bench dual gate; Clef vision for attestation pages | W6 |
| Editor and production | Docxodus, Open XML SDK, docx/docx-rs, LibreOffice, Collabora, ONLYOFFICE, pdf.js, Typst, qpdf, veraPDF | W8 |
| Studio research layer and precedent graph | stella legal-ast, legal-research-dsh, Harness-Multi-Agent-Legal, indigo, statedecoded, OpenNyAI, AILA | W11 |
| Case Conference and MOTO | mootloop personas and rubric judge, MOTO loop, activegraph forking | W11, W12 |
| Evaluation and security | Inspect AI, promptfoo, OpenTelemetry, MSB, mcp-scan, CaMeL reference code, GraphRAG-Bench, LegalBench, IL-TUR, AILA | W13 |
| Decision scoring | Clef / Clef-flash weights (HF), Ollama `clef:27b`, MiniCheck class | W14 |

---

## 2. Shell, installer and built-in browser (W0, W7)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **Electron** · [electron/electron](https://github.com/electron/electron) [S] | Bundled Chromium; `WebContentsView` for a true embedded tab with its own persistent partition; `session.on('will-download')` and `webContents.printToPDF` for capture; utility processes for the agent core; contextIsolation and sandboxed renderers | W0 shell; W7 court pane (partition per source and matter, downloads intercepted and hashed, no preload exposing Node) | Dependency |
| **electron-builder** / **electron-updater** | Signed NSIS installer; update channels (internal → public); differential updates | W0 installer (Stage 0 internal; Stage 5 public release) | Dependency |
| **@electron/fuses** + Electron security guidance | Disable RunAsNode, enforce ASAR integrity, sandbox all renderers | W0 hardening (D32) | Dependency |
| **OpenCode** · [anomalyco/opencode](https://github.com/anomalyco/opencode) · `237a847` [S] | Client/server split (agent server in a utility process, typed protocol to UI, headless CLI reuse); session/step runner shape; default-deny permission rulesets; `Plugin.define` transform hooks | W0 process topology; W4 loop shape; permission model (D4) | Reimplement |
| **Eclipse Theia** · [eclipse-theia/theia](https://github.com/eclipse-theia/theia) [S] | Panel/layout system, extension points, AI framework patterns | W0 layout reference; fallback base if custom layout overruns | Reference |
| **code-oss / VSCodium** · [microsoft/vscode](https://github.com/microsoft/vscode) | Workbench layout, command palette, keybindings | W0 UX reference (lawyer-facing, not code IDE) | Reference |
| **Zed** · [zed-industries/zed](https://github.com/zed-industries/zed) [S] | Fast editor interaction ideas | W8 interaction reference | Reference |
| **CEF** · [chromiumembedded/cef](https://github.com/chromiumembedded/cef) [S] | Low-level Chromium control concepts | W7 reference | Reference |

---

## 3. Harness core and model access (W0, W4)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **Pi** (pi-agent-core, pi-ai, Pi Durable) · [earendil-works/pi](https://github.com/earendil-works/pi) · `f09d01b` [S] | Smallest clean loop; hook vocabulary; per-tool replay policy; intent-before-execute; provider-quirk regression suite and `faux` provider | W4 loop (D1); journal intent rows (D5); W13 test doubles | Reference; test fixtures Extract |
| **DeepSeek Harness / Cordis** · [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness), [cordiverse/cordis](https://github.com/cordiverse/cordis) · `f3803c9`, `bb3bf8a` [S] | `Service` claiming `ctx.<name>`, `inject` gating, fiber lifecycle; "model-visible means logged"; fail-closed approvals; profiles | Service registry for legal components (D1) | Reimplement |
| **OpenAI Agents SDK (JS)** · [openai/openai-agents-js](https://github.com/openai/openai-agents-js) · v0.21.0 [S] | Serialisable `RunState` approvals; guardrails; MCP client | Fallback loop behind `AgentRuntime` (D7), tracing off | Dependency (fallback) |
| **Vercel AI SDK** · [vercel/ai](https://github.com/vercel/ai) · `dfed8e8` [S] | Provider interface, mock models, small tool loop | `ModelProvider` interface and test mocks behind the OpenRouter adapter | Dependency |
| **OpenRouter** (API + AI SDK provider) | Chat completions with provider routing; Decisions API for Clef | W0 single `ModelProvider` choke point (D8); W14 backend | Dependency |
| **Ollama**, **llama.cpp server**, **vLLM**, **SGLang** | OpenAI-compatible local endpoints; `/v1/systemone` for Clef | Local model for confidential matters (D8, D16) | Optional |
| **MCP TypeScript SDK** · [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk) | Tool transport; third-party servers out of process | Plugins (D21): Read/Prepare only, manifests pinned and hashed | Dependency |
| **Ajv** | JSON Schema 2020-12 validation | Kernel validators and compiled write tools (D9, D10) | Dependency |
| **xgrammar / llguidance / outlines** | Constrained decoding with per-call enums of in-context IDs | Local-model extraction in W3/W4 | Optional |
| **Mastra** · [mastra-ai/mastra](https://github.com/mastra-ai/mastra) · `292dd6c` [S] | Feature catalogue (memory, evals, workflows) | W4 feature checklist | Reference |
| **LangGraph / Deep Agents** · [langgraphjs](https://github.com/langchain-ai/langgraphjs), [deepagentsjs](https://github.com/langchain-ai/deepagentsjs) [S] | `interrupt()` ergonomics; summarisation and sub-agent middleware | Approval pauses; compaction | Reference |
| **Google ADK** · [google/adk-js](https://github.com/google/adk-js) [S] | Plugin callbacks; event-sourced sessions; rewind | Hook points; fork-from-ledger | Reference |
| **Cloudflare Agents** · [cloudflare/agents](https://github.com/cloudflare/agents) [S] | Approval-gated durable pause | Outbox approval flow (D12) | Reference |
| **OpenHands SDK** · [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) [S] | Security analyser and confirmation policy shapes; event-log schema | Policy step before Prepare; journal schema | Reference |
| **Python frameworks** (Pydantic AI, Agno, CrewAI, Strands, MS Agent Framework, LlamaIndex Workflows) [S] | Pydantic AI deferred tools and tool-effect ledger | Outbox and effect records | Reference |
| **Claude Agent SDK / Google Antigravity** [S] | Hook design (pre/post tool, permission prompts) | W0 hook vocabulary | Reference |
| **Pi chord** [S] | Out-of-process plugin handles | Third-party plugin host (D21) | Reference |
| **anylegal-oss** · [anylegal-ai/anylegal-oss](https://github.com/anylegal-ai/anylegal-oss) · `1b697ac` [S] | Loading Anthropic-format SKILL.md files unmodified | Skill import format for W4 playbooks | Reference |

**Loop [R].** Minimal custom TypeScript loop: model call → tool proposals → policy → Prepare → runtime verifier gate → Commit (D1, D6, D10, D14). Pattern B by default; Pattern C for W12 MOTO and the Case Conference.

---

## 4. Durability, ledger and provenance (W0, W9)

The MVP journal and ledger are our own code on SQLite (D5, D18). These repositories supply design and formats.

| Repository / spec | What we take | Where it fits | Use |
|---|---|---|---|
| **Embedded SQLite step journal** (ours) | Intent row before effect, result row after; resume by replay; same event schema as the ledger | `DurableRunner` (D5); kill-and-resume with zero duplicate ledger events (Stage 0) | Build |
| **Temporal** · [temporalio/temporal](https://github.com/temporalio/temporal), [sdk-typescript](https://github.com/temporalio/sdk-typescript) · v1.25.0 [S] | Updates with synchronous validation for gates; replay testing; worker versioning | Journal replay tests and gate semantics; durable server runner in P1 | Reference (MVP); P1 |
| **DBOS Transact** · [dbos-transact-ts](https://github.com/dbos-inc/dbos-transact-ts) [S] | Exactly-once database steps | Journal step semantics | Reference |
| **Restate** [S] | Durable journal of side effects per invocation | Journal design | Reference |
| **Inngest** [S] | Step functions with memoised step results | Step memoisation in replay | Reference |
| **Trigger.dev** [S] | Waitpoint tokens | Approval waits in the outbox | Reference |
| **Hatchet** · [hatchet-dev/hatchet](https://github.com/hatchet-dev/hatchet) [S] | Durable task queue patterns | Ingest worker queue | Reference |
| **Google AX** [S] | Preview agent execution patterns | Watch | Reference |
| **activegraph** (Log is the Agent) | Content-addressed response store; first-divergence replay; fork from cached prefix | Replay and fork-from-ledger for W12 branches | Reference |
| **RFC 8785 (JCS)** implementations | Canonical JSON for hashing; `hashProfile: "jcs-sha256-v1"` per row | W9 hash chain | Dependency |
| **in-toto attestation / DSSE** · [in-toto/attestation](https://github.com/in-toto/attestation) | Signed envelopes for the AI-origin manifest and verification receipt, bound to the filed document's SHA-256 | W9 manifest export (D31) | Dependency (format) |
| **C2SP specs** · [C2SP/C2SP](https://github.com/C2SP/C2SP) | Signed-note checkpoint format | Ed25519 signed checkpoints locally (D18) | Conform |
| **Tessera** · [transparency-dev/tessera](https://github.com/transparency-dev/tessera) | Witnessed Merkle transparency log with inclusion and consistency proofs | P1 witnessed ledger | P1 |
| **RFC 3161 TSA client** | Timestamp tokens on checkpoints when online | W9 | Dependency |
| **W3C PROV-O** | Ledger export vocabulary | W9 export | Format |
| **immudb** | Verify-on-read client pattern | Offline receipt verifier design | Reference |
| **Semantica** · [semantica-agi/semantica](https://github.com/semantica-agi/semantica) · v0.8.0 [S] | Versioned injective hash encoding per row; PROV-O export of the ledger; truth-maintenance filtering of retrieved context | W9 hash profile; W4 context filter | Reference |

---

## 5. Storage, graph and retrieval (W2, W3, W11)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **SQLite** (better-sqlite3 / node:sqlite) + **FTS5** | One database per matter; WAL; BM25 with Indian legal tokenisation | All modules (D17) | Dependency |
| **sqlite-vec** · [asg017/sqlite-vec](https://github.com/asg017/sqlite-vec) | Vector search inside SQLite | Hybrid retrieval with FTS5 + RRF | Dependency |
| **Typed edge tables** (ours) | `edges(src, type, dst, valid_from, valid_to, recorded_at, prov_ref)`; recursive CTEs | Case graph (W3); precedent graph (W11) | Build |
| **DuckDB** (+ DuckPGQ) | Query vanga parquet offline; citation-network metrics | Corpus mirror profiling and ontology seed (Stage 1); authority scores (W11) | Dependency (tooling) |
| **FlagEmbedding** (BGE-M3, bge-reranker-v2-m3) · [FlagOpen/FlagEmbedding](https://github.com/FlagOpen/FlagEmbedding) | Local dense/sparse embeddings and reranker | Retrieval in W3/W11, subject to eval | Optional |
| **Graphiti** · [getzep/graphiti](https://github.com/getzep/graphiti) | Bi-temporal edge invalidation on contradiction | Case-graph edge lifecycle (proposed to lawyer, never silent) | Reference |
| **XTDB v2** · [xtdb/xtdb](https://github.com/xtdb/xtdb) | Bitemporal column conventions | Statement and authority time columns | Reference |
| **Letta / Mem0** | Explicit memory tiers | Run scratch vs matter record separation | Reference |
| **Apache AGE, Neo4j, FalkorDB, Kuzu** | Graph query idioms | Recursive-CTE query patterns | Reference |
| **ParadeDB** | BM25 scoring configuration ideas | FTS5 ranking tuning | Reference |
| **GraphRAG-Bench** · [repo](https://github.com/GraphRAG-Bench/GraphRAG-Benchmark) | Method to test whether graph retrieval beats hybrid | W13 retrieval evaluation | Reference |

---

## 6. Ingest, OCR and anchors (W2)

SC judgments are English; regional-language OCR is post-MVP (P3).

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **Docling** · [docling-project/docling](https://github.com/docling-project/docling) · 2.145.0 [S] | Layout analysis and reading order (not its DOCX path for redlines, which drops `w:del`) | Python OCR/layout sidecar (D2) | Wrap |
| **pypdfium2 / PDFium** [S] | Render and hash pages | Page raster hashes for anchors | Dependency |
| **pdfplumber** · 0.11.10 [S] | Line geometry for born-digital judgments | Line model and `ReporterBlock` paragraph schemes | Dependency |
| **Tesseract** | Second OCR reader | Two-reader anchor model; disagreement sets confidence | Dependency |
| **PaddleOCR** · [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | Primary OCR engine family for scanned English records | OCR sidecar | Dependency |
| **PyMuPDF**, **MinerU**, **Marker** | Fast PDF text and layout extraction | Alternative readers in the sidecar, chosen by eval | Optional |
| **Apache Tika** · 4.2.0 [S] | Long-tail formats | Ingest sidecar | Optional |
| **OpenContracts** (Apache-2.0) | PAWLS token-level bounding-box annotations across scanned and born-digital PDFs | Geometric anchor layer: selectors map to token boxes, survive re-OCR (Stage 1 target ≥ 99%) | Reference |
| **dsh-legal-dashboard** · [ByronLeeeee/dsh-legal-dashboard](https://github.com/ByronLeeeee/dsh-legal-dashboard) · `78f767d` [S] | PDF classifier text/scanned/mixed/unknown; never-overwrite versioned saves; matter panel | Ingest routing; version DAG; W1 matter panel | Extract (classifier); Reference |

**Anchor model (ours).** Per page `page_no`, raster hash, lines `{line_no, bbox, text, confidence, engine@version, hash}`; a pinpoint is `{blob_sha256, page, line_range, char_offsets, quote_hash}`, expressed as W3C Web Annotation selectors, never a parser ID. SC caption metadata comes from the vanga parquet, not extraction.

---

## 7. Notebook & case graph and NVS (W3)

W3 mirrors SUPACE's publicly described functions (file preview, chatbot, logic gate, notebook) and, like SUPACE, organises material without evaluating merits (C1 §7.1).

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **mootloop** · [damienriehl/mootloop](https://github.com/damienriehl/mootloop) · `37c2273` [S] | `gates/fabrication.py`: claimed fact ids exist; any sentence with a quote, amount or date must find that span in a cited fact's provenance or the corpus; grounding floor. `citations/ledger.py`: append-only fsync'd JSONL; "a persona can never assert 'verified'" | NVS deterministic gates G1–G7; status derived only from the ledger | Extract + Reimplement in TypeScript |
| **ChronosAI** · [deekshithaswarna/ChronosAI](https://github.com/deekshithaswarna/ChronosAI) · `077eeee` [S] | Date-anchor regex pass before the LLM; relative-date resolution with anchor recorded; actor reconciliation; dramatis personae; materiality | Logic-gate dates, parties and chronology | Reimplement |
| **stella `@stll/decision-reader`** · [stella/stella](https://github.com/stella/stella) · `ebbf038e` [S] | Pure anchor/annotation placement on decision text | Anchored preview and highlights | Extract / Dependency (package level; its desktop app is not our shell) |
| **new-litigation-visualization** · [MiaoQichuan/new-litigation-visualization](https://github.com/MiaoQichuan/new-litigation-visualization) · `58f70a8` [S] | Model emits a structured spec; a deterministic renderer computes every coordinate; relation and evidence-confrontation charts | Notebook relation and evidence views from typed items | Reference / Extract renderer ideas |
| **Prism-Legal-OS** · [FuturixAI-and-Quantum-Works/Prism-Legal-OS](https://github.com/FuturixAI-and-Quantum-Works/Prism-Legal-OS) · `fdb81bc` [S] | Tabular review and review-playbook UX | W10 review UI tables | Reference |
| **dsh-legal-work-bench** · [kingselyjoe/dsh-legal-work-bench](https://github.com/kingselyjoe/dsh-legal-work-bench) · `6cccce5` [S] | Fail-closed dual gate (fact verification + compliance); audit chain (version, source, approval, timestamp) | NVS gate composition; W9 event fields | Reference |
| **Text2KG** · [semintelligence/Text2KG](https://github.com/semintelligence/Text2KG) [S] | Annotation protocol (two annotators + adjudicator); competency questions; evidence that caption blocks are rule-tractable | W13 golden judgments set; ontology tests | Reference |

---

## 8. Citation verification and Indian legal data (W5)

| Repository / source | What we take | Where it fits | Use |
|---|---|---|---|
| **eyecite** · [freelawproject/eyecite](https://github.com/freelawproject/eyecite) | Tokenizer, reporters database, resolver architecture with string coordinates | TypeScript INSC parser with an India reporters file (INSC, SCC, SCR, AIR, Cri LJ, SCC OnLine, HC neutral); years from 1950 (back-assigned INSC) | Reimplement |
| **CiteSight**, **CaseCite** | Local/BYOK citation verification flow: parse, query primary databases, confirm authority and quote accuracy | W5 resolver UX and quote-check flow, adapted to the T1/T2/T3 chain | Reference |
| **vanga/indian-supreme-court-judgments** · [repo](https://github.com/vanga/indian-supreme-court-judgments); [AWS registry](https://registry.opendata.aws/indian-supreme-court-judgments/) [S] | `s3://indian-supreme-court-judgments` (ap-south-1, no-sign-request): English judgments from 1950, partitions into 2026 (thin for 2025–2026), 69.34 GB; PDFs + parquet (`title`, `petitioner`, `respondent`, `judge`, `author_judge`, `citation`, `case_id`, `cnr`, `decision_date`, `disposal_nature`, `nc_display`, `path`); README says bi-monthly updates, pipeline code runs daily | T2 offline mirror (Stage 1); ontology reference layer seed (D29); `coverageWindow` per snapshot → `unresolved: outside_corpus_coverage` | Dependency (data) |
| **vanga HC repo** (`highcourt_case_type_dropdown_full.csv`) [S] | HC case-type inventory | Ontology seed for HC metadata; P3 HC resolver | Dependency (data) |
| **sci.gov.in / scr.sci.gov.in** | Official neutral-citation and case-number search behind CAPTCHA | T1: lawyer solves CAPTCHA in W7; harness captures PDF + SHA-256 (D22) | Source |
| **Indian Kanoon** | Search, document and metadata endpoints | T3 via user-triggered webfetch or API with the user's key (D24) | Source |
| **Law and Justice Wiki** · [lawandjusticewiki.org](https://www.lawandjusticewiki.org/) | Concept definitions; mixed-format citation strings | Non-normative glossary (D29); resolver test corpus | Source |
| **OpenNyAI / Legal-NLP-EkStep** · [OpenNyAI/Opennyai](https://github.com/OpenNyAI/Opennyai); InLegalBERT | `legal_NER` (judges, courts, statutes, provisions, parties); rhetorical-role baseline (Facts, Arguments, Ratio, Ruling, …) | Candidate generators for W5 and W3; rule that argument spans cannot pass as findings (maps to Clef `voice`) | Optional |
| **bharat-courts** · [PyPI](https://pypi.org/project/bharat-courts/) · 0.5.0 [F] | HC/district case data access | P3 connectors | P3 |
| **Presidio** · [microsoft/presidio](https://github.com/microsoft/presidio) | PII recognisers (add Indian recognisers) | Pseudonymisation before external model calls; `Nipun Saxena` masking in W6 | Dependency |
| **Splink** | Probabilistic record linkage | Party alias tables across documents | Optional |

Resolver order, levels and outcome axes are specified in C5.

---

## 9. Editor, DOCX engine and production (W8)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **Docxodus** · [JSv4/Docxodus](https://github.com/JSv4/Docxodus) · v14.3.0 `12c7603` [S] | Word-style compare (ins/del/moves/pPrChange); N-way consolidate; `DocxSession` anchor-addressed tracked edits; content-derived anchors; change receipts; round-trip contract accept(compare(L, R)) ≡ R and reject ≡ L; WASM build | In-app editor (D19); agent edits only as tracked changes authored `Agent:<role>:<run_id>`, revision → run/evidence map in the ledger; WYSIWYG and WASM size checked in a Stage 3 spike against 30 complex SC-format DOCX files | Dependency (pinned, vendor-tested) |
| **Open XML SDK** · [dotnet/Open-XML-SDK](https://github.com/dotnet/Open-XML-SDK) · 3.4.1 [S] | Schema validation of emitted DOCX | Sidecar alongside Docxodus | Dependency |
| **docx** (npm) / **docx-rs** · [bokuweb/docx-rs](https://github.com/bokuweb/docx-rs) [S] | Generate drafts with authored tracked changes | New drafts from templates | Optional |
| **LibreOffice headless + unoserver / Gotenberg** [S] | DOCX → PDF; second compare oracle | Production fallback; W13 compare check | Optional |
| **Collabora Online** · [CollaboraOnline/online.mirror](https://github.com/CollaboraOnline/online.mirror) · 26.04.6.0 [S] | Full LibreOffice fidelity in a pane; WOPI lock/timestamp semantics | User-installed local editor server; WOPI conflict model for "open in Word" re-ingest | Optional |
| **ONLYOFFICE Docs** · [ONLYOFFICE/DocumentServer](https://github.com/ONLYOFFICE/DocumentServer) · v10.0.0 [S] | Best OOXML fidelity; `SetAssistantTrackRevisions` for AI-attributed edits | User-installed separate editor; attribution pattern for agent revisions | Optional |
| **SuperDoc** | Browser DOCX editing with tracked changes | Editor UI reference | Reference |
| **Tiptap core / ProseMirror / Yjs** · [ueberdosis/tiptap](https://github.com/ueberdosis/tiptap) [S] | Structured block editing | Notebook editor (W3) and Studio notes | Dependency (core) |
| **Mammoth** | DOCX → HTML preview | Quick preview in W2 | Optional |
| **Office.js Word add-in** | Tracked changes in the lawyer's Word | "Open in Word" handoff complement (post-MVP add-in) | Later |
| **pdf.js** · [mozilla/pdf.js](https://github.com/mozilla/pdf.js) | Viewer and text layer | Anchor layer highlights from our OCR boxes (D20) | Dependency |
| **Typst** · [typst/typst](https://github.com/typst/typst) | Deterministic PDF/A with SC format tokens | Production (D20) | Dependency |
| **qpdf** · [qpdf/qpdf](https://github.com/qpdf/qpdf) · v12.4.2 [S] | Paper-book assembly, bookmarks | Production | Dependency |
| **veraPDF** | PDF/A validation | Production gate | Dependency |

Hostile-file rule: parsing workers and optional editor servers run without network and with resource limits; macros and OLE stripped before any editor opens a file (D32).

---

## 10. Research & Argument Studio, precedent graph and statutes (W11)

W11 mirrors LegRAA's publicly described functions under RTS and, like SUPACE, organises and verifies rather than evaluating merits.

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **stella `@stll/legal-ast`** · [stella/stella](https://github.com/stella/stella) · `ebbf038e` [S] | Typed judgment/statute AST: holdings, citations, provisions, effective dates, amendment history, runtime guards, versioned types | Precedent nodes and statute provisions; reference extraction | Extract / Dependency (package level) |
| **stella workspace app** | Matter workspace UX patterns | W0/W11 UX reference | Reference |
| **legal-research-dsh** · [kingselyjoe/legal-research-dsh](https://github.com/kingselyjoe/legal-research-dsh) · `364d2b7` [S] | Six-stage resumable research directory; per-source "verified against original" status | Research organisation under RTS | Reference |
| **Harness-Multi-Agent-Legal** · [Seren-xx/Harness-Multi-Agent-Legal](https://github.com/Seren-xx/Harness-Multi-Agent-Legal) · `3c18e66` [S] | Planner task DAG with bounded re-planning; blackboard; deterministic conflict check when one statute hits several amendment versions | RTS amendment-version flag; temporal law (IPC/BNS) | Reimplement |
| **indigo** · [laws-africa/indigo](https://github.com/laws-africa/indigo) · `db15f7b` [S] | Akoma Ntoso model: FRBR work/expression URIs; point-in-time consolidation (`timeline.py`); `refs`, `terms`, `differ`, `toc` analysis | Optional AKN statute layer (D29); point-in-time statute retrieval | Reference / Optional separate server |
| **statedecoded** · [statedecoded/statedecoded](https://github.com/statedecoded/statedecoded) · `554622f` [S] | Editions (point-in-time); scoped definitions; cross-reference autolinker; permalink per section | Statute display and cross-references | Reference |
| **IIT Kharagpur AILA** (FIRE 2019 track) | Fact description → relevant statutes and precedents benchmark for SC | Research-layer retrieval evaluation (W13) | Reference (benchmark) |
| **OpenNyAI rhetorical roles** | Ratio/Analysis vs argument spans | Treatment and holding-status features | Optional |
| **DuckDB** | Offline citation-network authority scores | Precedent ranking feature | Dependency (tooling) |

**Precedent graph (ours).** Edges record citing paragraph, treatment, evidence quote, bench strengths and dates; "overruled" only with an anchored overruling passage and bench-strength/date check; treatment scored by W14 (Jev permitted on public text); negative treatments always to a lawyer queue.

---

## 11. Case Conference and MOTO engine (W11, W12)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **mootloop** · [damienriehl/mootloop](https://github.com/damienriehl/mootloop) [S] | Six personas (associate, partner, opposing associate and partner, judge, rubric judge); rubric-gated loops; `adversarial-first` strategy; human-on-the-loop gates | Case Conference roles, rubric judge checked against spans, commit-before-see ordering | Reimplement |
| **MOTO** (repository read in research note 04) | Generate → validate → prune loop shape; typed rejection reasons fed back to generators | W12 Pattern C loop; its single LLM novelty validator and keyword contradiction checker replaced by CVS/RTS gates and W14 scoring; Lean 4/Z3 checking not applicable | Reimplement |
| **activegraph** | Fork from cached prefix | Branching argument hypotheses from ledger snapshots | Reference |

W12 feeds candidate arguments into W11; the lawyer accepts or rejects. Neither module outputs outcome probabilities.

---

## 12. Evaluation, observability and security (W13, W0)

| Repository | What we take | Where it fits | Use |
|---|---|---|---|
| **Inspect AI** · [UKGovernmentBEIS/inspect_ai](https://github.com/UKGovernmentBEIS/inspect_ai) | Frozen eval suites; conformance runs | W13 Verifier/Eval agent (Python eval worker); NVS/CVS/RTS reports that close stages (D15, D34) | Dependency |
| **promptfoo** · [promptfoo/promptfoo](https://github.com/promptfoo/promptfoo) | CI assertions and red-team | CT suites in CI | Dependency |
| **OpenTelemetry JS** | Tracing with a local exporter to the matter journal; no vendor egress | W0 observability | Dependency |
| **Langfuse** (core) | Trace UI | P1 server observability | P1 |
| **MSB (MCP Security Bench)** · [dongsenzhang/MSB](https://github.com/dongsenzhang/MSB) | 12 attack types, 405 tools, 2,000 attacks | Run against the tool gateway before enabling third-party MCP servers | Test harness |
| **mcp-scan** · [invariantlabs-ai/mcp-scan](https://github.com/invariantlabs-ai/mcp-scan) | Tool manifest scanning | CI and at tool approval | Dependency |
| **CaMeL reference code** · google-research/camel-prompt-injection | Control/data-flow separation | Reader/actor split for untrusted content | Reference |
| **GraphRAG-Bench**, **LegalBench** · [HazyResearch/legalbench](https://github.com/HazyResearch/legalbench), **IL-TUR**, **AILA** | External smoke tests and metric definitions | W13 external yardsticks | Reference |

---

## 13. Decision scoring (W14)

| Artifact | What we take | Where it fits | Use |
|---|---|---|---|
| **Clef / Clef-flash** · [HF Clef](https://huggingface.co/Cloudflare/clef), [HF Clef-flash](https://huggingface.co/Cloudflare/clef-flash) | System One contract (`state` + typed `questions` → probabilities); self-hostable weights | W14 scoring for NVS extraction checks, CVS identity/pinpoint/proposition, RTS treatment, defect flags; via OpenRouter Decisions API or local | Dependency (model) |
| **Ollama `clef:27b`** | `POST /v1/systemone` on the lawyer's Windows PC | Confidential matter text stays local; recalibrated separately from BF16 | Optional |
| **Jev** (TypeSafe AI, hosted) | Heterogeneous second scorer | Public text only (precedent treatment over judgments) until retention terms are written | Optional |
| **MiniCheck-class checkers**, AlignScore, HHEM-open, LettuceDetect | Non-Qwen encoder scorer; unsupported-span highlighting | Independence pair for Clef in W13; W10 highlights | Optional |

One client interface keyed on the System One contract with backends {openrouter, ollama, sglang}; routed by matter confidentiality flag (D16). Deterministic gates always veto first.

---

## 14. Closed analogs (not repositories)

| System | What it shows | Our difference |
|---|---|---|
| **SUPACE** (Supreme Court, launched 6 Apr 2021) | Four-tier factual-matrix workflow; logic gate organises, does not evaluate | W3 implements the functions locally with anchored, gated items |
| **LegRAA** (NIC AI Division, pilot) | Research aid over SC judgments | W11 research layer under RTS |
| **Vincent AI (vLex), Lexis+ AI, CoCounsel** | Automated authority checks and headnotes | Closed SaaS, whole-case retrieval, no deterministic paragraph pinpoints, no signed audit manifests; W5 and W9 provide these locally |

No single open system unifies a local desktop workspace, deterministic paragraph-level citation verification, a hash-chained ledger with signed receipts and a court defect checker; the novelty is the assembly (C1 §7.2).

---

## 15. After MVP (P1–P3)

- **P1 gateway and server profile:** PostgreSQL 18 (`WITHOUT OVERLAPS`, RLS) with pgvector; durable server runner (Temporal or DBOS Transact); Tessera witnessed checkpoints; OpenFGA or Cedar access control; Langfuse core.
- **P2:** macOS and Linux builds from the same Electron code.
- **P3:** bharat-courts and eCourts/sci.gov.in connectors via BrowserCapture; HC resolver over the HC dataset; regional-language OCR (PaddleOCR Indic models).
