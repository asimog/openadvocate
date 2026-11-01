# C7. Integration architecture: kernel, extensions, agent runtime, external boundaries

Status: exploration research. No code changed. Date: 2026-11-01. Repository inspected at `6ac2def` (branch `main`; untracked: C6 research files and `docs/research/sources/`).

Scope: the architecture *around* the Word Editor and Setu Commons. Their internals belong to other workstreams and are not redesigned here. Existing code and docs are evidence, not authority.

Tags: **[V]** verified in this repo this session. **[K]** from prior knowledge of the project's public code/docs, **not re-read at source this session**. Treat every [K] as a claim the spike must confirm. **[I]** inference. **[R]** recommendation.

**Source verification pass (same day):** §12 records what was checked against primary sources and what changed. Three findings changed the document: (1) the Node permission model is explicitly *not* a defence against malicious code, so §5.4 and §8 are revised; (2) DeepSeek Harness is a full Cordis-based agent harness with a JSON-RPC SDK server, which makes it a second runtime candidate (§4); (3) Pi moved to `earendil-works/pi`, and its tool-selection flags exist, which closes the main Pi open question.

---

## 0. Answer to the central question (one paragraph)

Make the **ledger the kernel**. It already is the single authority over canonical state, ownership and provenance [V]. Add the missing piece around it: **one host that issues scoped capabilities to contributions**. Do not add a framework. Every capability, first- or third-party, is an *extension* described by one JSON manifest. It contributes typed things (commands, tools, views, validators, connectors, workflows, agent runtimes). It touches matter state only through host calls that end in `ledger.append` under its own actor identity, and the existing `OWNERS` table is widened from actor *kind* to extension *grant*. Release 1 has two execution models only: **in-process for first-party code** and **a child process over JSON-RPC 2.0 (stdio) for everything else**, including Pi or any other agent runtime. Keep the current React/Vite workbench and wrap it in Electron. Theia is rejected for now. Cordis supplies ideas (reversible registration, scoped disposal) but no dependency and no public API. The Word Editor and Setu plug in as contracts: the editor is a view plus a document-revision proposer, and Setu is a schema and identifier provider the kernel validates against.

---

## 1. Deliverable 1: Verified architecture assessment

### 1.1 What exists

| Concern | Owner today | Evidence | State |
|---|---|---|---|
| Canonical state | `Ledger` in `packages/core/src/ledger.ts`: append-only, hash-chained, every event schema-validated | `append()` checks `OWNERS`, then `assertValid('LedgerEvent')`, then chains `prev` → `hashOf` [V] | In memory only. SQLite is Phase 5 in `docs/plan.md` [V] |
| Authority | `OWNERS: Record<EventType, Actor['kind'][]>`, a static table of 13 event types × 7 actor kinds (`lawyer`, `notebook`, `verifier`, `studio`, `moto`, `pleading`, `court`) | lines 10–24 [V]. `verifyChain` re-checks owners when replaying (line 72) [V] | Enforced, but by **kind**, not by instance. Any code holding a `Ledger` can construct any `Actor` |
| Schema / standard | `standard/schemas/ulos.schema.json` → `ulos.gen.ts` by codegen; ajv validation | `package.json` scripts, `core/src/validate.ts` [V] | Implemented. This is the Setu-adjacent seam (§7.2) |
| Provenance / receipts | `core/src/receipt.ts`, `apps/cli/src/ulos.ts` (signed receipts; commit 6ac2def "ilac verify requires the expected signer key", before the rename to ulos) [V] | Implemented |
| Layers | `notebook` (record), `citations` (verification), `studio` (argument + MOTO), `pleading` (SLP state machine, defects, limitation), `matter` (composed views) | `docs/architecture.md`, package dirs [V] | Implemented as libraries. Dependencies point downward only [V] |
| Workflow | `packages/pleading/src/machine.ts` + `guards.ts`: an explicit SLP state machine that writes `pleading.transitioned` | [V] | Implemented, hard-wired for SLP |
| Agent / model path | `studio/src/moto.ts`: `ArgumentModel` port, "the only generative port in the system". `fixtureModel` for tests. A real provider (OpenRouter or local) is a comment only | lines 12–33, 65 [V] | Port exists. No runtime, no tool-calling, no budget |
| Composition / app | `apps/workspace/src/session.ts` imports every package directly and wires them by hand. React + Vite, browser only | [V] | No registry, no DI, no lifecycle |
| Extensions / plugins | **None.** `grep -i "plugin\|extension\|registry"` hits only domain words (the SC registry sim, extractors) [V] | Absent |
| Desktop | No Electron dependency in any `package.json` [V]. Planned for Phase 5 | Absent |
| Court access | `sim/supreme-court` (simulated corpus, registry, filing, evaluation agent) as `actor.kind = 'court'` [V] | Simulated only |
| Editor | None in code. C6 proposes Docxodus with an editor↔host interface (C6 §5) [V: doc read] | Other workstream |

### 1.2 Verified gaps

1. **No extension identity.** Authority sits at the actor-kind level. A third-party "studio-like" contribution would have to impersonate `studio`. That is the core gap for any extension story.
2. **The ledger is handed around as an object.** Whoever holds it can append as any kind. Enforcement is honest only while all code is first-party and in-process.
3. **`session.ts` is the composition root,** and it is hand-wired. Adding a capability means editing the app.
4. **No proposal type for documents.** `claim.proposed` exists, but no `document.revision.proposed` / `accepted` exists (C6 noted this too). The editor integration needs one.
5. **One generative port, no tools.** `ArgumentModel.generate(prompt) → Claim[]` is a function, not an agent loop. That is good for now, because it is the narrowest possible runtime boundary.
6. **The workflow is a package, not a contribution.** SLP is fine as the only workflow today. Nothing yet lets a second workflow reuse guards or defects without importing `pleading`.

`✶ Note:` the repo already does the hard part most plugin platforms get wrong: **authority lives in the data layer (`OWNERS` + schema validation inside `append`), not in UI code**. Everything below extends that one choke point. It adds no parallel authority.

---

## 2. Deliverable 2: Theia assessment

### 2.1 What Theia is [K]

An Eclipse (EPL-2.0 / GPL-2.0-with-classpath-exception) framework for IDE-like apps. It uses InversifyJS DI with "contribution" interfaces (commands, menus, keybindings, widgets, preferences), a frontend/backend split over JSON-RPC (websocket), and an Electron target. It has a VS Code extension-API compatibility host (a plugin host process) and an AI framework (Theia AI). Theia *extensions* are compile-time npm packages bundled into the product. Only VS Code-style *plugins* load at runtime.

### 2.2 Comparison

| Criterion | Existing React/Vite (+ Electron) | Theia | Minimal custom Electron workbench | Hybrid (borrow concepts) |
|---|---|---|---|---|
| Desktop integration | Add Electron main + preload. Small, well understood | Built in | Same as left | Same as left |
| UI flexibility | Full. The current GUI is legal-document-first | IDE layout (dock panels, Lumino widgets, Monaco). Legal UI must fight or override it [K] | Full | Full |
| Extension lifecycle | None today | Mature for compile-time extensions. Runtime plugins speak the **VS Code API**, not ours [K] | Must build (small) | Build small, copy Theia's contribution-point idea |
| Extension host / isolation | None | Plugin host process exists, but it is VS Code-API shaped and not a capability sandbox [K] | One child-process host (§5.4) | Same |
| Public API independence | Easy | Hard. The natural path makes third parties write Theia/VS Code extensions, which **violates the core requirement** | Easy | Easy |
| DI / composition | None | Inversify (heavy, decorator-based) | Small registry (§3) | Small registry |
| Performance / footprint | Lightest | Heaviest: large dependency tree, IDE startup cost [K] | Light | Light |
| Accessibility | React + own work | Monaco/Lumino a11y is decent for code, untested for legal docs [K] | Own work | Own work |
| Dev experience for third parties | n/a | Must learn Theia or VS Code concepts | Learn one OA manifest + JSON-RPC | Same |
| Packaging | electron-builder (planned) | Theia CLI/electron builders | electron-builder | electron-builder |
| Maintenance risk | Low | Tracks Theia releases plus the Inversify/Monaco stack | Low | Low |

### 2.3 Finding

The problem Theia solves (a general IDE shell with code-editor-grade contribution points) is **not this product's problem**. Its strongest asset, the VS Code plugin host, would make the VS Code API the de facto public contract. The things Open Advocate actually needs (matter-scoped capability grants, ledger-mediated commits, proposals) Theia does not provide, so they would be built anyway, on top of a heavier base.

**[R] REJECT Theia as a dependency. ADOPT "existing React/Vite + thin Electron shell" with a small contribution registry. That is "minimal custom", but grown from the current code, not rewritten.** Borrow from Theia/VS Code: named contribution points, `when`-clause-style context keys for command enablement, and manifest-declared contributions so the UI can be built before activation (lazy activation).

**Smallest spike (≤3 days):** an Electron main process that hosts the existing workspace, plus one view, one command, and one tool contributed by a manifest-described extension in a child process, rendering in a host-owned panel slot. Pass criteria: the extension cannot call `ledger.append` directly, the contributed command appears before activation, and killing the child leaves the app usable. If this spike exceeds ~1.5 kLOC of host code, re-open Theia.

---

## 3. Deliverable 3: Cordis assessment

### 3.1 What it is [K, verify]

Cordis (by shigma, the Koishi chatbot framework lineage, MIT) is a TypeScript meta-framework built around a `Context`. Plugins are functions or classes applied with `ctx.plugin(p, config)`. Services are provided with `ctx.provide`/`ctx.set` and injected by declared `inject: [...]` names. A plugin whose required services are missing simply does not start until they appear. Events use `ctx.on/emit`. **Every side effect made through a context is recorded on its "fork" and reversed automatically when that plugin is disposed.** Errors in a plugin are caught per fork. The handoff links `deepseek-ai/deepseek-harness` as the Cordis reference. **I have not verified at source that that repository is built on Cordis, or what it adds. That is the first item of §11's verification list.** All Cordis statements here are about Cordis itself.

### 3.2 Borrow / do not borrow

| Concept | Borrow? | Where in OA |
|---|---|---|
| **Reversible registration:** every `register*` returns a disposer tied to the extension's scope, and deactivation runs them all | **Yes, the key idea** | Host registry (§5.1) |
| Dependency-gated activation ("start when required services exist") | Yes, simplified: resolved once at load from the manifest, no dynamic re-gating in R1 | Lifecycle (§5.5) |
| Per-plugin error containment | Yes | Host wraps each activation. Process isolation does the rest for third parties |
| Typed service interfaces, name-keyed | Yes, internally | Kernel services (`matter`, `documents`, `ledger`) |
| Scoped contexts (fork per plugin, per matter) | Yes: **scope = (extension, matter)**, which carries the grant set | Host |
| Cordis as a runtime dependency | **No.** Its value is ~300 lines of ideas. Its event and service models would become a second authority path beside the ledger | — |
| Cordis `Context` as the public API | **No.** It is in-process, TypeScript-only, and capability-unaware (any plugin can `ctx.get` any service) | Public API is JSON-RPC + manifest |
| Global event bus that any plugin can emit on | **No.** Matter events are ledger events. UI events are host-owned. Extensions *subscribe* to declared event types | — |

**Verified [V]:** Cordis is at `github.com/cordiverse/cordis`, MIT-licensed, and calls itself a "meta-framework of spatiotemporal composability". Its README warns: "API is not yet stable and may change without notice." In `packages/core/src/fiber.ts`, each `Fiber` collects disposables from its effects and runs them on dispose. Errors during plugin apply are caught, logged and stored on that fiber, not re-thrown to the parent. DeepSeek Harness confirms the pattern at scale ("registrations are effects that unwind when their plugin unloads"). Its separate `scope` package shows the one addition we need: **one registration context = per-agent visibility + shared lifetime**, which matches our (extension, matter, task) scope. The unstable API is one more reason not to take it as a dependency.

**[R] ADOPT WITH LIMITATIONS:** apply the Cordis *pattern* inside the host (one registry, scoped disposers, error fences). Add no Cordis dependency and expose no Cordis type publicly. This keeps a single plugin manager, the host.

---

## 4. Deliverable 4: Pi and agent-runtime assessment

### 4.1 What Pi is [K, verify]

Pi (pi.dev; Mario Zechner's `pi-mono`: `pi-ai` unified multi-provider LLM API, `pi-agent-core` agent loop, `pi-coding-agent` CLI, MIT). It is a deliberately minimal coding agent with a small default tool set (read, write, edit, bash), TypeScript extensions, skills, session trees persisted as JSONL, and a **headless RPC mode (JSON over stdin/stdout)** that external hosts can drive. Extensions run in-process with full Node privileges. It is **not a sandbox**, as the handoff says.

**Verified updates [V]:** the code now lives at `github.com/earendil-works/pi`. `--no-tools` starts with every tool disabled, and `--tools <list>` is an allow-list. Extensions register tools with `pi.registerTool()` and can block calls in a `tool_call` handler (`{ block: true, reason }`). The docs say extensions "run with your full system permissions and can execute arbitrary code". RPC mode is JSONL over stdin/stdout with an `agent_settled` completion event. **No RPC method for a host to register tools is documented.** The adapter is therefore: run `pi --mode rpc --no-session --no-tools -ne -e <oa-bridge>`, where `oa-bridge` is a small Pi extension that registers each host-granted tool as a proxy calling back to the host.

**Second candidate: DeepSeek Harness (`dsh`) [V].** It is Cordis-based, MIT-licensed and in developer preview ("compatibility-breaking changes"). Every part is a plugin: the model adapter, the scoped tool registry (`ctx.tools`), the append-only session log, and the agent loop. It ships an SDK JSON-RPC server profile (`dsh --profile sdk`), an ACP server, an Electron desktop host, fail-closed approval and OS sandbox backends. It is far larger than Pi. As a *runtime behind our adapter* it fits the same `task.*` boundary. As a *platform to build Open Advocate on* it would replace our kernel with its session log and make Cordis our public API, so it is rejected for that role. The rule "model-visible means logged" (every model request can be rebuilt from the log) is directly borrowable for task transcripts.

### 4.2 Analysis

- The repo's current boundary (`ArgumentModel`) is a pure function. Any runtime fits behind it.
- What a legal task needs from a runtime: model access, a loop, tool calls *to host tools only*, a token/cost budget, and streaming events. Pi's RPC mode supplies all of that **if its built-in filesystem and bash tools are disabled** and only host-proxied tools are registered. **Whether Pi's RPC mode allows replacing the default tool set entirely must be verified.** If it does not, Pi still runs as the loop through `pi-agent-core` as a library inside *our* runtime process.
- Coding-agent prior art ([K]: OpenCode's per-tool `allow/ask/deny` permissions and client/server split; Codex's OS sandbox via Seatbelt/Landlock, approval modes, and `AGENTS.md`) is useful for **patterns** (per-tool ask/deny, a sandboxed exec process, an event stream), not as the product runtime. Development harness ≠ product runtime. Keep them separate.

### 4.3 Recommended boundary [R]

**The agent runtime is an extension of contribution type `agentRuntime`, always out-of-process, speaking the same JSON-RPC as every other external extension.** Pi connects through a ~200-line adapter extension. The host never embeds a runtime in its own process.

Minimum Agent Interface (host ⇄ runtime):

```ts
// host → runtime
task.start({ taskId, instructions, context: ContextItem[], tools: ToolSpec[],
             budget: { maxTokens, maxToolCalls, deadline }, model?: ModelRef })
task.cancel({ taskId })

// runtime → host (requests)
tool.call({ taskId, tool, args })        → host checks the grant, runs, records, returns
model.complete?(…)                       // optional: host-brokered model gateway (§4.4)

// runtime → host (notifications)
task.event({ taskId, kind: 'text'|'thinking'|'tool'|'usage', … })
task.result({ taskId, proposals: Proposal[], transcriptRef })
```

- `ContextItem`s are **refs plus excerpts the host chose**, never a path or database handle.
- `Proposal` is the only output that matters, for example `claim.proposed` or `document.revision.proposed`. The host appends it under actor `{ kind: 'agent', extension, runtime, taskId }` after schema validation.
- Every `tool.call` is appended to a task transcript, a content-addressed blob referenced from the proposal event. That is provenance without bloating the ledger.

### 4.4 Model gateway

Put model keys in the host (OS keychain) and broker `model.complete`. Runtimes that insist on calling providers themselves get a per-task scoped key or a local proxy URL, never the raw secret. Pi's `pi-ai` can live *in the host's gateway* as a library: library use, not runtime authority.

### 4.5 Smallest legal-native harness

There are three parts, and none is a new "framework": (1) the `task.*` protocol above, (2) a host tool registry where each tool is a contribution with input/output JSON Schema and a required grant, and (3) budget counters plus a transcript writer. MOTO becomes "N tasks with different `model` refs under one budget, results → Case Conference". Verification stays a separate `validator` contribution run by the host, never by the proposing runtime.

---

## 5. Deliverable 5: Unified extension architecture

### 5.1 Kernel (owned by the host, never by an extension)

| Kernel service | Exists? | Note |
|---|---|---|
| Ledger (append, validate, chain, `OWNERS`) | Yes | Extended: `OWNERS` checks grants (§8) |
| Schema registry (ULOS + extension-declared event/record schemas, namespaced) | Partially (ULOS only) | Extensions may add **namespaced** event types `x.<extId>.*`, which never override core types |
| Matter and document identity (`source.added`, revisions by hash) | Partially | Revision events are added for the editor (§7.1) |
| Extension registry and lifecycle | No | New, small |
| Capability grants and consent | No | New |
| Contribution registry (one table keyed by contribution point) | No | New: the Cordis-style reversible registry |
| Task broker (agent tasks, budgets, transcripts) | No | New |
| Secrets and model gateway | No | New, small |
| Workbench shell (layout, panel slots, command palette) | Partially (React app) | |

Everything else, including Notebook extractors, citation verifier, Studio, MOTO, SLP, sim court, editor, Setu adapters and court connectors, is **an extension**. First-party extensions run in-process **but receive the same scoped host API object**, not the `Ledger`.

### 5.2 Contribution types (one system, typed points)

| Point | Shape | Example today |
|---|---|---|
| `commands` | id, title, `when`, handler | "Verify all citations" |
| `views` | slot (`sidebar` / `main` / `panel` / `inspector`), webview or in-process React | Notebook view, editor |
| `tools` | name, input/output schema, required grants, `readOnly` flag | `citation.lookup`, `notebook.search` |
| `validators` | target record type, schema → `Check` | Defect checker, citation verifier |
| `workflows` | state machine declaration (§6.3) | SLP |
| `connectors` | external system id, operations each tagged `read` / `mutate` | Sim Supreme Court, later eCourts |
| `knowledge` | retrieval provider over sources and authorities | Studio research corpus |
| `agentRuntimes` | implements §4.3 | Pi adapter, fixture model |
| `skills` | Markdown instructions + required tools, data only, no code | "Draft list of dates" |
| `eventTypes` / `schemas` | namespaced JSON Schema | `x.slp.*` |
| `settings` | JSON Schema config | |

Document processing (OCR) is a `tool` plus a `validator`. A data connector is a `connector`. Neither needs a separate category, so the twelve categories of the handoff collapse into these points.

### 5.3 Manifest (JSON, validated by a JSON Schema; minimal)

```json
{
  "id": "in.openadvocate.slp",
  "version": "0.3.0",
  "publisher": "openadvocate",
  "engines": { "openadvocate": "^1.0" },
  "runtime": { "kind": "inprocess", "main": "dist/index.js" },
  "dependsOn": { "in.openadvocate.notebook": "^1", "in.openadvocate.citations": "^1" },
  "permissions": ["matter.read", "ledger.append:x.slp.*", "ledger.append:pleading.transitioned",
                  "tool.invoke:citation.*", "connector.read:sc.registry"],
  "contributes": { "commands": [...], "views": [...], "workflows": [...], "validators": [...] },
  "activation": ["onWorkflow:slp", "onCommand:slp.*"],
  "integrity": { "sha256": "…", "signature": "…" }
}
```

Leave resource limits, marketplace metadata and payment out until something needs them.

### 5.4 Execution models: release 1 = two

| Model | R1? | Why |
|---|---|---|
| In-process (TS module, same API object) | **Yes, first-party only** | Speed and simplicity. Trust comes from shipping it ourselves |
| Child process, JSON-RPC 2.0 over stdio | **Yes, all third-party, all agent runtimes** | Language-neutral, crash-contained, OS-killable. The "contract test" for the public API |
| Browser/UI | Views from external extensions render in a **sandboxed iframe/webview** with `postMessage` → host RPC | Required as soon as a third-party view exists |
| Worker threads | No | Same trust domain as in-process, so they add little |
| WebAssembly (WASI/component model) | Later | The best real sandbox for pure computation (validators). Revisit when a validator ships from a third party |
| Hosted services | Via a `connector`, not an execution model | |

Process isolation alone is not a sandbox: a Node child can still read the disk. **Revised after verification.** Node's permission model (`--permission`, `--allow-fs-read`, `--allow-net`, `--allow-child-process`, `--allow-worker`; Stable since v22.13/v23.5) is documented as a "seat belt" that "does not protect against malicious code" [V]. It is also bypassable through symlinks, existing file descriptors and `node:sqlite` [V]. So R1 uses it **only to catch mistakes by trusted code**, not as the trust boundary. Consequences:

- **R1 runs only extensions it trusts:** first-party extensions plus signed, allow-listed ones whose permissions the lawyer has consented to. "Untrusted marketplace code" is out of scope for R1.
- Real confinement of untrusted code needs an OS sandbox. DeepSeek Harness shows it is buildable in TypeScript: `dsh-sandbox-local` provides Linux bwrap/Landlock, macOS Seatbelt and a Windows ACL restricted-token backend, though the Windows backend "reports partial enforcement" [V]. That is deferred until a third party that isn't trusted needs to ship code. WASM for pure validators is the cheaper route.
- Network access is still denied unless granted and goes through a host proxy. Secrets never enter the child's environment.

### 5.5 Lifecycle and dependency resolution

`discover → validate manifest+signature → resolve deps (semver, acyclic, fail closed) → consent (grants) → register static contributions (UI visible, not active) → activate on trigger → run → deactivate (run all disposers, kill process) → update (deactivate, swap, re-consent if permissions grew) → disable / revoke (grants removed, pending tasks cancelled) → uninstall (ledger events it wrote **remain**: history is immutable)`.

- Conflicts: contribution ids are namespaced by extension id. Two `workflows` claiming the same `matterType` both register, and the lawyer picks one per matter, so the host never chooses silently.
- Failure: activation throws → extension marked `failed`, its contributions greyed out, no retry loop. Child crash → in-flight tool calls return errors, tasks cancel, and a proposal is never half-written because append is atomic.

### 5.6 Versioning

There is one public API version (`engines.openadvocate`) covering three surfaces: the JSON-RPC methods, the manifest schema, and the ULOS schema version. The ULOS is a standard, so it should version independently from the app (owned by the standards workstream). The host supports N and N-1 API majors through an adapter shim.

---

## 6. Deliverable 6: Modules and workflows

### 6.1 Terms (each with exactly one job)

| Term | Is | Owns state? | Registered as |
|---|---|---|---|
| **Kernel** | Ledger, schemas, grants, registry, task broker | All canonical state | — |
| **Extension** | The unit of install, version, permission and trust | No, it proposes through the host | Manifest |
| **Contribution** | One typed thing an extension adds | No | Contribution point |
| **Service** | A kernel or extension capability with a typed interface, reached through tools or the host API | Kernel services only | Internal |
| **Tool** | A callable, schema-typed operation, usable by agents and UI alike | No | `tools` |
| **Skill** | Instructions + required tools (data, not code) | No | `skills` |
| **Agent runtime** | Executes tasks by calling tools | Transient run state only | `agentRuntimes` |
| **Agent task** | One authorised, budgeted run whose output is proposals | Transcript blob | Task broker |
| **Workflow** | A declared state machine over matter events | Its state is **derived from ledger events**, like everything else | `workflows` |
| **Module** | **A product-level bundle**: an extension (or extension pack) whose identity is a legal capability (SLP, Bail, Writ) and which contributes a workflow plus views, skills and validators, and depends on shared extensions | No | Just an extension with `dependsOn` |

Module is a **packaging and UX concept, not a fourth registry**. That removes the risk of overlapping registration systems.

### 6.2 SLP as the reference case

The SLP module = `in.openadvocate.slp`, which contributes the `slp` workflow (today's `machine.ts` + `guards.ts`), the defect validators (`defects.ts`), the limitation tool (`limitation.ts`), synopsis and grounds skills, and views. It depends on `notebook` (documents, extracts), `citations` (verification), `studio` (claims), and the `sc.*` connectors. It does not copy any of them.

### 6.3 What a workflow declares (only what SLP proves it needs)

```
states, transitions { from, to, guard: validatorId[] | requiresDecision: lawyer }
requiredDocuments (by ULOS document type), deadlines (tool: limitation), rulesVersion
```

The host evaluates guards by running the named validators and appends `pleading.transitioned` (or `x.<ext>.transitioned`) only when they pass. Human approval points are transitions whose guard requires a lawyer-actor event. **Do not build a generic engine.** The declaration is data the SLP code already implies. The second workflow (Bail, Writ) is the test of whether it generalises.

---

## 7. Deliverable 7: External integration architecture

### 7.1 Word Editor (internals owned elsewhere; C6 proposes Docxodus)

What the editor *needs from the host*, and nothing more:

| Need | Contract |
|---|---|
| Open a document | `documents.open(ref)` → bytes + current revision hash. The editor never sees a filesystem path |
| Save work | The editor proposes `document.revision.proposed { base: hash, new: hash, author }`. The host stores the blob, appends, and rejects the save if `base` ≠ current (no silent races) |
| Accept AI edits | Agents produce tracked changes as revision proposals. Accepting is a lawyer action → `document.revision.accepted` |
| Insert verified citation / extract | Editor calls tools `citations.lookup`, `notebook.extract.get`. Inserted spans carry the ref, giving provenance in the document |
| UI | One `views` contribution (main slot) + `commands` (e.g. "Export filing DOCX") |
| Events | Subscribes to `document.*` and `citation.verified` to mark stale citations |
| Permissions | `documents.read:matter`, `documents.propose`, `tool.invoke:citations.*` |

New kernel event types needed: `document.revision.proposed`, `document.revision.accepted`. **These belong in the ULOS schema, so coordinate them with the standards workstream rather than adding them unilaterally.** This is consistent with C6 §5 ("Editor ↔ host interface: typed, in-process call through a host object; not filesystem"). The one refinement here: that host object should be *the same* scoped API every extension receives, not a bespoke editor API.

### 7.2 Setu Commons (internals owned elsewhere)

The repo's `standard/` (ULOS schema, ontology, codegen, `examples/`) is the current consumption seam [V]. How Open Advocate consumes Setu:

- **Schemas:** the kernel's schema registry loads published Setu schema versions (pinned, hash-verified), and codegen produces types. The app never forks the taxonomy.
- **Identifiers:** court, case, citation and document identifiers are resolved by a `knowledge`/`connector` contribution implementing Setu's resolver interface, whatever Setu defines. **This document does not define that interface.**
- **Compatibility:** `engines` in the manifest references the ULOS/Setu version. The host refuses events whose schema version it cannot validate.
- **Ownership:** Setu publishes, Open Advocate validates and stores. Open Advocate never becomes Setu's registry.

### 7.3 Court connectors

- One `connectors` contribution point, so modules never embed HTTP clients. A module declares `connector.read:sc.registry`. Any installed extension that provides `sc.registry` satisfies it, which makes implementations replaceable (sim today, a real one later).
- Operations are tagged `read` or `mutate`. **`mutate` (filing, payment) always requires a per-invocation lawyer confirmation** issued by the host, not by the connector UI.
- Responses enter as `source.added` with actor `{ kind: 'court', connector: extId, endpoint, retrievedAt, responseHash }`. That is the existing `court` actor kind, now with an instance.
- Unavailable or unauthorised → typed errors (`unavailable`, `unauthorised`, `notSupported`) that workflows treat as `unresolved`, never as `passed`.
- No real public API for eCourts, NJDG, ICJS, LIMBS or e-filing is assumed here. Whether one exists, and on what terms, is for the connector author and Setu to establish (see `C6-judicial-data-interop-findings.md`, owned elsewhere).

### 7.4 eCourts Phase III lessons for a practitioner workbench [I]

Phase III emphasises open standards, API-first services, federated implementation and data governance. For this product that means: consume shared standards (Setu) instead of inventing them; keep court connectors federated and replaceable; keep local, lawyer-owned data under local control; and **never present derived data as official**. Open Advocate is an independent application, not part of eCourts infrastructure.

---

## 8. Deliverable 8: Security and authority model

1. **One commit path.** `ledger.append` is reachable only inside the host. Extensions receive `host.propose(body)`. The host stamps the actor `{ kind, extension, version, taskId? }`, checks the grant, validates the schema, then appends.
2. **`OWNERS` becomes two-level:** event type → allowed actor kinds (unchanged, so the static safety net stays), **and** the extension must hold a grant `ledger.append:<type>`. Kind says *what role may ever write this*. Grant says *whether this installed code may*.
3. **Grants are host-issued, per extension, optionally per matter**, recorded as ledger events (`extension.granted` / `revoked`) so consent is itself auditable.
4. **Agents get the intersection** of (task grant) ∩ (runtime extension grant) ∩ (lawyer's per-task approval for mutating tools). No tool is visible to an agent unless the task lists it.
5. **Generative output is always a proposal.** It inherits today's rule: claims are `blocked` unless their grounds are verified, confirmed or accepted [V: `docs/architecture.md`].
6. **Verification independence:** a validator extension may not validate records proposed by itself or by the same task. The host checks the actor ids.
7. **Isolation ≠ consent, and in R1 the isolation is weak.** Process separation contains crashes. Node permission flags only stop honest mistakes [V]. The grant dialog gives consent. For R1 the trust boundary is therefore *signing + allow-list + consent*. An OS sandbox (§5.4) is required before untrusted third-party code is accepted.
8a. **Approval fails closed** (borrowed from DeepSeek Harness `ctx.approval` [V]). Approval outcomes form a closed set: `allowed-once | rejected | cancelled | unavailable`. Anything except `allowed-once` denies, and a missing or broken answerer means `unavailable`. **Guards can only deny:** a guard listener has no "allow" result, so a later listener cannot undo an earlier denial (dsh's monotonic `ToolGuard` [V]).
8. **Supply chain:** signed manifests (Ed25519; `@noble/curves` is already a dependency [V]), sha256 integrity, and a local allow-list. A registry (Open VSX-style) comes later.
9. **Secrets** live only in the host keychain and are never put in an extension's environment.
10. **Revocation** cancels tasks, kills processes and removes grants. Past events remain and stay attributable.

---

## 9. Deliverable 9: Minimal roadmap (proofs, in order)

| # | Proof | Problem / owner | Acceptance | Tests |
|---|---|---|---|---|
| 1 | **Scoped host API over the ledger** | Gap 1–2 / core | Workspace runs with packages calling `host.propose`, not `ledger.append`. Forged actor → throws | Unit: grant matrix. Existing e2e unchanged |
| 2 | **First-party extension proof:** `citations` loaded from a manifest through the registry | Gap 3 / host | `session.ts` no longer imports `citations` directly. Disable → its contributions disappear, ledger intact | Registry dispose test, e2e |
| 3 | **Module composition proof:** SLP as a manifest that depends on notebook + citations | §6 | SLP guards run through validator contributions. Missing dependency → module not activated, clear UI state | GM-01 golden matter passes unchanged |
| 4 | **Agent-runtime proof:** fixture runtime out-of-process via `task.*`, then the Pi adapter | §4 | MOTO claims arrive as proposals with transcript refs. Runtime cannot read files outside its directory. Kill mid-task → no partial event | Protocol conformance suite, chaos kill |
| 5 | **Independent-developer proof:** an outsider builds a Python validator (e.g. annexure page-numbering check) from docs alone | §5 public API | Installs, asks for one grant, contributes checks, can be revoked | Conformance suite runs against it |
| 6 | Electron shell (the Theia replacement spike, §2.3) | §2 | As in §2.3 | Playwright on Electron |

Proofs 1–3 need no Electron and no new dependencies.

---

## 10. Deliverable 10: Decisions

| ID | Problem | Existing owner | Decision | Alternatives | Consequences | Verification | Status |
|---|---|---|---|---|---|---|---|
| A1 | Who is the kernel | `core` Ledger | Ledger + host = kernel. Everything else is an extension | Framework-defined kernel (Theia/Cordis) | Smallest change. Authority stays in one place | Proof 1 | Proposed |
| A2 | Workbench | `apps/workspace` | Keep React/Vite, add Electron later. Reject Theia | Theia, hybrid | Own a small registry | §2.3 spike | Proposed |
| A3 | Internal composition | none (`session.ts`) | Cordis *pattern*, no dependency | Cordis, Inversify | ~300 LOC host registry | Proof 2 | Proposed |
| A4 | Public API | none | Manifest + JSON-RPC 2.0, language-neutral. First-party uses the same API object in-process | TS-only API | Two transports, one contract | Proof 5 | Proposed |
| A5 | Execution models R1 | none | In-process (first-party) + child process (third-party, runtimes) | WASM, workers, hosted | Node permission flags as the R1 sandbox | Proof 4 | Proposed |
| A6 | Agent runtime | `ArgumentModel` port | Out-of-process `agentRuntime` contribution, Pi via adapter | Embed Pi, custom loop | Runtime swappable without host change | Proof 4 | Proposed, pending Pi RPC check |
| A7 | Authority | `OWNERS` by kind | Kind table + per-extension grants, grants on the ledger | Grants outside the ledger | Consent is auditable | Proof 1 | Proposed |
| A8 | Document revisions | none (editor workstream) | `document.revision.proposed/accepted` in ULOS, bound to base hash | Editor owns storage | Needs the standards workstream to agree | Editor team review | Open |
| A9 | Module concept | `pleading` package | Module = extension bundle, no extra registry | Separate module system | One registry | Proof 3 | Proposed |
| A10 | Persistence | in-memory Ledger | Unchanged here: SQLite per `plan.md` Phase 5. Extension state is either ledger events or private KV per extension | Postgres, graph DB | No new store | — | Deferred |

**Explicitly not built yet:** marketplace or registry server, payments, WASM host, a generic workflow engine, multiple simultaneous agent runtimes per task, a distributed event bus, a graph DB, Theia, a server/Postgres mode, OS-level sandboxing, hot reload of third-party extensions.

### Open questions

1. ~~Is DeepSeek Harness Cordis-based?~~ **Resolved: yes [V].** New question: is `dsh --profile sdk` a better first runtime than Pi? Run both adapters against the same `task.*` conformance suite. Pi is the default because it is much smaller.
2. ~~Can Pi run with zero built-in tools?~~ **Resolved: `--no-tools` [V].** Still open: whether the Pi bridge extension can make an async call back to the host over the same stdio, or needs a second local socket.
3. ~~Does the Node permission model hold on Windows?~~ **Superseded:** it is not a security boundary on any OS [V]. New question: when untrusted extensions arrive, which OS sandbox do we use on Windows, given dsh's restricted-token backend has partial enforcement?
4. Will the standards workstream accept namespaced extension event types (`x.<ext>.*`) in the ledger schema?
5. Per-matter or global grants by default? This is a UX and consent question for lawyers.

---

## 11. Final assessment

| Question | Verdict | Problem real? | Tech solves it? | Existing owner? | Unverified |
|---|---|---|---|---|---|
| Theia | **REJECT** (for now) | Yes (workbench) | Partly, at the cost of API independence | React app | Spike cost of the custom route |
| Cordis | **ADOPT WITH LIMITATIONS** (pattern only) | Yes (composition) | Yes, as ideas | None | deepseek-harness contents |
| Pi | **ADOPT WITH LIMITATIONS** (out-of-process adapter) | Yes (agent loop) | Likely | `ArgumentModel` port | Tool-set replacement in RPC mode |
| Kernel = ledger + host | **ADOPT** | Yes | Yes | `core` Ledger | — |
| Unified manifest + JSON-RPC API | **ADOPT** | Yes | Yes | none | Developer ergonomics (Proof 5) |
| Two execution models | **ADOPT WITH LIMITATIONS** (R1 runs only trusted, signed code; no untrusted code until an OS sandbox exists) | Yes | Crash containment yes. Security only with an OS sandbox [V] | none | Windows sandbox choice |
| DeepSeek Harness as runtime | **ADOPT WITH LIMITATIONS** (candidate behind the adapter, not the platform) | Yes | Likely, via the SDK JSON-RPC profile | — | Preview API stability |
| Generic workflow engine | **REJECT** (until workflow #2) | Not yet | — | `pleading` | — |
| Module as separate system | **REJECT** (module = extension bundle) | No | — | — | — |
| Editor and Setu integration via contracts | **ADOPT** (revision events need agreement) | Yes | Yes | Other workstreams | Their acceptance of A8 |
| Existing SQLite / no graph / explicit state machines | **ADOPT** (unchanged) | Yes | Yes | `plan.md` | — |

## Sources

- Repository at `6ac2def`: `packages/core/src/ledger.ts`, `packages/studio/src/moto.ts`, `apps/workspace/src/session.ts`, `docs/architecture.md`, `docs/plan.md`, all `package.json` files, `docs/research/C6-document-editor-and-module-architecture.md`.
- Eclipse Theia: https://theia-ide.org/docs/extensions/ [V]
- Cordis: https://github.com/cordiverse/cordis [V]. DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness [V]
- Pi: https://pi.dev/, https://github.com/earendil-works/pi [V]
- OpenCode: https://github.com/sst/opencode [K]. Codex CLI: https://github.com/openai/codex [K]
- VS Code extension manifest / activation events: https://code.visualstudio.com/api [K]
- Node.js permission model: https://nodejs.org/api/permissions.html [V]
- eCourts Phase III vision: https://ecommitteesci.gov.in/document/vision-document-for-phase-iii-of-ecourts-project/ [K]

## 12. Source verification log (2026-11-01)

| Claim | Result | Source |
|---|---|---|
| DeepSeek Harness is built on Cordis | **Confirmed.** "Cordis is the framework under dsh… Every part of the product is a plugin, including the model adapter, the tool registry, the session log, and the agent loop" | `deepseek-ai/deepseek-harness` `docs/architecture.md` |
| dsh tool policy | **Confirmed, and borrowed:** scoped `ToolRestriction` (restrictions intersect); `ToolGuard` "can only reduce permission" | `docs/subsystems/tools.md` |
| dsh approval | **Confirmed, and borrowed:** closed `ApprovalOutcome`, callers "fail closed unless it is `allowed-once`" | `docs/subsystems/approval.md` |
| dsh OS sandbox | **Confirmed:** bwrap/Landlock, Seatbelt, Windows ACL restricted token (partial enforcement); filesystem only, "network and process visibility are outside this vocabulary" | `docs/subsystems/sandbox.md` |
| dsh runtime surfaces | **Confirmed:** `sdk` profile = SDK JSON-RPC server; `acp` profile; Electron desktop host; developer preview, MIT | `README`, `docs/architecture.md` |
| Cordis reversible effects, per-plugin error capture | **Confirmed in source** | `cordiverse/cordis` `packages/core/src/fiber.ts` |
| Cordis API stability | **Unstable** ("may change without notice") | `cordiverse/cordis` README |
| Pi tool control | **Confirmed:** `--no-tools`, `--tools`, `--no-builtin-tools`, `--exclude-tools`, `-ne`/`-e` | `earendil-works/pi` `packages/coding-agent/docs/cli.md` |
| Pi extensions not sandboxed | **Confirmed:** "run with your full system permissions and can execute arbitrary code" | `…/docs/extensions.md` |
| Pi host-registered tools over RPC | **Not documented.** Use the bridge-extension design (§4.1) | `…/docs/rpc.md` |
| Theia extensions are compile-time with full DI access; runtime plugins speak the VS Code API in a dedicated process | **Confirmed** | theia-ide.org/docs/extensions |
| Node permission model as a sandbox | **Refuted:** "does not protect against malicious code"; symlink, file-descriptor and `node:sqlite` bypasses | nodejs.org/api/permissions.html |
| OpenCode, Codex, VS Code, Open VSX, eCourts Phase III details | **Not re-checked in this pass.** They remain [K]. None of them carries a decision in this document | — |
