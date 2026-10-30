# C1 — Literature Review

**Canonical literature review for Vakilbench (the Open Code of Litigation workspace) and the Indian Legal AI Commons.** Research cut-off: 30 October 2026.

Companion canon documents:
- `C2-prior-art-repos-review.md`: repositories we build from and where each fits.
- `C3-master-research-and-architecture.md`: architecture, decision register (D1–D35) and stages (authoritative).
- `C4-master-product-plan.md`: MVP modules and post-MVP plan.
- `C5-master-standards-and-ontology-plan.md`: ontology, NVS/CVS/RTS, INSC resolver, manifest and receipt, CT suites.

**Scope.** The MVP is a Windows desktop application (Electron, signed NSIS installer, auto-update) with the complete harness source open: one workspace per matter, built-in Chromium browser, built-in Docxodus editor, BYO OpenRouter key or local OpenAI-compatible model, local SQLite journal and hash-chained ledger (D3, D5, D8, D18). It contains the W3 Notebook & case graph, citation verification, the defect checker, the W11 Research & Argument Studio (research layer, precedent graph with treatment, Case Conference) and the MOTO Argument Hypothesis Exploration Engine, with an independent runtime verifier and a separate Verifier/Eval agent (D14, D15, D25–D27). This review covers the papers, policy texts and court systems that shape those decisions. Model training and outcome or judge prediction are out of scope; papers on them are cited only for evaluation design or exclusion.

**Decision, stage and module IDs** are those of the register in C3 (D1–D35; Stage 0–5; P1–P4; modules W0 shell and model access, W1 matters, W2 documents & evidence, W3 Notebook & case graph, W4 research & drafting agents, W5 citation verifier (CVS), W6 defect checker, W7 built-in browser, W8 editor, W9 ledger & manifest export, W10 review UI, W11 Research & Argument Studio, W12 MOTO hypothesis engine, W13 Verifier/Eval agent, W14 Jev/Clef decision scoring service).

## Labels

| Family | Values | Meaning |
|---|---|---|
| Verification | **[V-read]** | Full text read |
| | **[V]** | Title, authors, year and link confirmed on the primary page; details from abstract or partial read |
| | **[V-abs]** | Abstract page fetched; nothing beyond the abstract is reported |
| | **[V-link]** | Link and title confirmed; body not fetched |
| | **[PK]** | Prior knowledge, not re-verified; do not quote externally |
| | **[V-sec]** | Verified only through a secondary source |
| | **[U]** | Listed in an index only |
| Type | PR / PP / TR / COM / POL / CASE | Peer-reviewed / preprint / technical or working paper / vendor / policy / judgment |

Epistemic labels in text: **[F]** fact, **[S]** source inspected, **[A]** academic finding, **[I]** inference, **[R]** recommendation. Missing authors or venues are written "not verified".

---

## 1. Executive summary

The literature does not support making a litigation system reliable through larger generators, more agents or longer contexts. It supports moving correctness into places the model cannot touch.

1. **Deterministic identity keys**: which document, which paragraph, which statute version, which governing date. LLM checkers catch 93–100% of wrong-case citations but miss 39–63% of wrong-pinpoint citations in US opinions (Verma 2026) [A]. The best agentic checker on a real-brief benchmark recalls 18.2% of wrong pincites, blamed on missing pagination (LePhantomCite 2026) [A]. Supreme Court of India judgments are paragraph-numbered, so the pinpoint check becomes a lookup if the vault keeps official paragraph boundaries [I]. → D23, D24.
2. **Typed, compiled write paths**: agents never write the record directly. Ontology-to-tools compilation, PatchBoard and MemTX support compiling schemas into the only write tools, having agents propose typed patches, and letting a deterministic kernel validate and commit with provenance; retractions cascade to dependents [A, abstract-level]. *From Prompts to Contracts* gives the only controlled ablation: prompt-only enforcement let 30 violations through in 120 runs; code-owned contracts let none through and kept full utility [A]. → D9, D10, D11.
3. **Gates held by evidence**: a verifier helps only when its verdict gates the state transition, and the evidence must be fresh and bound to the exact version hash (Proof-or-Stop) [A]. A single agent plus a centralised verifier beats rosters of specialists on sequential reasoning (Kim et al. 2025) [A]. → D13, D14, D34.
4. **Measurement against the harness, not just the model**: the same model varies up to 40× in tokens per solved task across harnesses, and results depend on model × harness pairing [A]. The separate Verifier/Eval agent reports model, harness version and config hash with every result. → D15.
5. **Decision models score, they do not decide**: Jev and Clef return calibrated-by-training probabilities over typed questions, with no rationale and no published calibration or legal benchmark. They score extraction checks, citation support and precedent treatment after deterministic gates, with thresholds calibrated on lawyer-labelled sets. → D16.

The Indian sources converge on the same controls. The Supreme Court's **draft** *Regulations for Use of Artificial Intelligence (AI) in Courts, 2026* (notice dated 03.06.2026; not notified) require disclosure of origin and verification of GenAI content "through a designated centralised mechanism" (Reg 3(1)(y)), define hallucination to include fabricated or misstated precedents and provisions (Reg 3(1)(z)), make AI output advisory (Reg 8(3)), and let the Court demand "the AI System used, the nature and extent of AI assistance … and the steps taken to verify the accuracy" (Reg 43(4)). The ledger, verifier and AI-origin manifest answer these clause by clause (D31; §6.1).

The largest gaps are Indian and are also our evidence assets: no public benchmark exists for paragraph-level citation support in SCC/INSC, for temporal statutory QA across IPC→BNS, for precedent treatment in SC judgments, for automation bias among practising advocates, or for structure extraction from pleadings.

---

## 2. Literature → decision map

| Register decision | What the literature contributes | Primary evidence | Strength |
|---|---|---|---|
| D1, D4 Own small harness; OpenCode-style permissions | Simple composable patterns beat frameworks; framework-owned state conflicts with an external legal record | Prompts to Contracts; Log is the Agent; Anthropic/Cognition practitioner notes | Moderate |
| D6 Pattern B default, Pattern C loops | Bounded turns as journalled steps; generate–validate loops for MOTO and Case Conference | AI co-scientist; AlphaEvolve/MAP-Elites; Reflexion | Moderate |
| D9 Schema-compiled write tools | Constraints enforced during generation, not after | Ontology-to-tools 2602.03439 | Moderate (abstract) |
| D10 Propose → validate → commit | Typed JSON Patch proposals checked by a deterministic kernel; fewer tokens, higher success | PatchBoard 2605.29313; Prompts to Contracts | Moderate |
| D11 Cascade invalidation | Retraction propagates to dependents; irreversible acts gated on in-flight beliefs | MemTX 2607.23929 | Moderate |
| D12 Outbox | Shadow state plus outbox for external effects; release after whole-workflow validation | Cordon 2606.17573 | Moderate |
| D13, D34 Proof-or-Stop; evidence-gated build | Advisory reviewers barely help; gating reviewers with fresh evidence do | Proof-or-Stop 2607.14890 | Weak–moderate |
| D14 One agent + independent runtime verifier | Centralised verification limits error propagation; multi-agent losses on sequential tasks | Kim et al. 2025; MAST; Who&When | Strong (not legal) |
| D15 Separate Verifier/Eval agent | Harness is part of the system under test; planted-defect methodology; preregistered independent evaluation | Scaffold Effect; Harness-Bench; LePhantomCite; Magesh 2024 | Moderate–strong |
| D16 Jev/Clef scoring with deterministic veto | Selective prediction, conformal thresholds, calibration under shift | Mohri & Hashimoto; Geifman & El-Yaniv; Kamath; MiniCheck; vendor notes | Strong methods; models unmeasured |
| D17 SQLite + FTS5 + sqlite-vec; typed edges | Graphs help on typed structural relations, not as LLM everything-stores; strong BM25 | GraphRAG-Bench; LeSICiN; CLERC; COLIEE | Moderate |
| D18 Hash-chained ledger | A chain is a write-ahead log; outsider-verifiable proofs need Merkle logs and witnesses (P1) | Crosby & Wallach; RFC 9162; PROV-AGENT | Strong |
| D21, D22, D32 Plugins, court access, security | Agents reading untrusted text must not act on it; more capable agents can be more vulnerable to MCP attacks | CaMeL; Design Patterns; FIDES; MSB | Strong |
| D23, D24 NVS/CVS/RTS; INSC resolver | Three-level citation verification; separate technical and semantic axes; missing ≠ fabricated | Verma; LePhantomCite; AttributionBench; Magesh | Strong (US), convergent |
| D25 Notebook (SUPACE-referenced) | Small curated contexts; deterministic chronology; claim decomposition | NoLiMa; Context Rot; TempReason; LexChronos; FActScore | Strong direction |
| D26 Studio research layer, precedent graph, Case Conference | Point-in-time law; typed treatment edges; walled structured debate; formal argument status | Prior et al.; SAT-Graph RAG; Wynn et al.; ArgLLMs; Zhang/Grabmair/Ashley | Moderate |
| D27 MOTO engine | Quality-diversity archive, pairwise tournaments, typed rejection memory; staged validators instead of a single LLM judge | AI co-scientist; MAP-Elites; Reflexion | Moderate |
| D29 Ontology from SC/HC metadata | Caption metadata is high-yield but better sourced from metadata; competency-question-driven growth; bi-temporal fields | TEXT2KG; OntoExtend; Zep; LaMAS4PD | Moderate |
| D31 AI-origin manifest + receipt | Field-level requirements from the draft Regulations; hash as "electronic fingerprint" | Draft Regulations 2026; *Pune Bar Assn.* 2026 | Strong as requirement |
| Review UI (Stage 2) | Lower the cost of checking; evidence plus verdict; forcing only at high-stakes gates | Vasconcelos; Bansal; Buçinca; Kim 2024; Steyvers | Strong HCI |
| Scope exclusion | No win probabilities or judge-level forecasts | Medvedeva et al.; ILDC critique; Zambrano; NyayaRAG; draft Reg 20(1)(d),(f) | Strong |

---
## 3. Papers that shape current decisions

Decision-shaping papers use a full record (problem, method, findings, limitations, decision). Corroborating work gets shorter entries. None of the 2026 harness papers below links code except MSB; they are designs we implement, not dependencies.

### 3.1 Typed writes and transactions (D9–D12)

**Decision.** Agents get no free-form write access to the matter record. ILO JSON Schema 2020-12 is compiled into the only write tools. An agent's write is a proposal: an RFC 6902 JSON Patch against typed objects. The owning service's kernel validates schema, shapes, role and invariants, then commits with a ledger event in one transaction. Statements and draft paragraphs carry `dependsOn` edges; a failed citation or an overruled authority flags dependents and blocks export. External effects go to an outbox released only by payload-bound approval.

#### Ontology-to-tools compilation for executable semantic constraint enforcement in LLM agents (2026)
`PP · [V-abs]` · Zhou, Bulter, Yang, Rihm, Angkanaporn, Akroyd, Mosbach, Kraft · arXiv [2602.03439](https://arxiv.org/abs/2602.03439)
- **Problem.** Agents populating a knowledge graph produce instances that violate the ontology; post-hoc validation catches errors late.
- **Method.** Compile the ontology into MCP tools the agent must use to create or modify instances; extract → validate → repair loop (The World Avatar).
- **Findings.** Constraint enforcement works; no numbers in the abstract; no code link.
- **Limitations.** Abstract only; chemistry/engineering domain.
- **Decision.** D9: schema → tool-definition generator in the ILO SDK; invalid objects cannot be expressed.

#### PatchBoard: Schema-Grounded State Mutation for Reliable and Auditable LLM Multi-Agent Collaboration (2026)
`PP · [V-abs]` · Zhang, Shi, Zhang, Zhao, Wang · arXiv [2605.29313](https://arxiv.org/abs/2605.29313)
- **Problem.** Agents coordinate through transcripts and mutate shared state unreliably.
- **Method.** Agents propose JSON Patch edits; a deterministic kernel checks schema, role write permissions and invariants, then commits transactionally.
- **Findings.** ALFWorld success 84.6% vs 30.8% for LangGraph, at about 45k vs 368k tokens per success.
- **Limitations.** Household tasks; abstract-level.
- **Decision.** D10. Coordination goes through typed matter state, not transcripts.

#### MemTX: Transactional Belief Commit for Stateful Agent Memory (2026)
`PP · [V-abs]` · Li et al. (list not verified) · arXiv [2607.23929](https://arxiv.org/abs/2607.23929)
- **Problem.** Irreversible actions rest on beliefs that later prove false.
- **Method.** Snapshot-isolated staged writes carrying evidence, permissions, provenance and validity; irreversible calls gated on in-flight beliefs; retraction triggers typed cascade repair.
- **Findings.** Invariants checked over 5.5M states.
- **Decision.** D11; conformance test "retract authority → dependents flagged → export blocked" (C5).

#### Cordon: Semantic Transactions for Tool-Using LLM Agents (2026)
`PP · [V-abs]` · Chen et al. (not verified) · arXiv [2606.17573](https://arxiv.org/abs/2606.17573)
- **Method.** Shadow state for reversible changes, outbox for external effects, whole-workflow validation before release.
- **Decision.** D12: e-filing, email and form submission from the built-in browser go through the outbox; unknown outcome → reconciliation gate.

**Corroborating.** Atomix ([2602.14849](https://arxiv.org/abs/2602.14849), `[V-abs]`): progress-aware transactions; relevant only if several agents edit one draft concurrently. AgentGit ([2511.00628](https://arxiv.org/abs/2511.00628), `[V-abs]`): save/revert/fork of workflows; implemented on our ledger as branch-a-draft. SagaLLM ([2503.11951](https://arxiv.org/abs/2503.11951), `[U]`): compensating actions as an alternative to the outbox. Palantir Ontology typed actions (`COM · [U]`): the industry form of ontology-to-tools.

### 3.2 Contracts, evidence gates and the log as the record (D1, D13, D34)

#### From Prompts to Contracts: Harness Engineering for Auditable Enterprise LLM Agents (2026)
`PP · [V-read]` · Joongho Ahn, Moonsoo Kim · arXiv [2607.08028](https://arxiv.org/abs/2607.08028) · code + Zenodo release
- **Problem.** Behaviour that must be guaranteed is placed in prompts, which are requests, not enforcement.
- **Method.** Code-owned control layer: source manifests, evidence records and promoted claims define what may enter an answer; validators enforce structure; the LLM phrases a bounded claim package; a deterministic composer answers on validation failure.
- **Findings [A].** 270 live runs: code checks passed 270/270; 13.3% fell back to the deterministic composer. **Ablation (120 runs/arm): harness 0 violations with 120/120 utility; prompt-only 30 violations reached the reader; external guardrail 0 violations but 88/120 utility.**
- **Limitations.** Measures contract preservation, not truth; one model in the ablation; self-built programme.
- **Decision.** `OutputPolicy` validators with single owners; deterministic fallback composer for presentation tasks only (verification keeps `UNRESOLVED`); a three-arm ablation (harness / prompt-only / external filter) in our security evaluation.

#### Proof-or-Stop: Don't Trust the Agent, Trust the Evidence (2026)
`PP · [V-abs]` · Huang, Hsia, Sun, Shi, Huang, White · arXiv [2607.14890](https://arxiv.org/abs/2607.14890)
- **Method.** A lifecycle transition is allowed only when fresh, mechanically verifiable evidence bound to the tracked source state satisfies the gate.
- **Findings [A].** 10/10 unattended scenarios with zero false-DONE; signed receipt bundles rejected 18 tamper classes; at near-equal compute a reviewer that advises allowed 14/1,800 amplified failures vs 2/1,800 when it gates.
- **Limitations.** One model family; 24 tasks; abstract only.
- **Decision.** D13: every "verified"/"ready"/stage-done transition binds `attestsHash` to the exact version; edit-after-approval refuses Commit. D34: a build stage closes only on a signed receipt bundle (commit hash + CT + Eval-agent results).

#### The Log is the Agent: Event-Sourced Reactive Graphs for Auditable, Forkable Agentic Systems (2026)
`PP · [V-read]` · Yohei Nakajima · arXiv [2605.21997](https://arxiv.org/abs/2605.21997)
- **Method.** Append-only event log as truth; typed graph as a deterministic fold; model responses cached by hash of the full request; strict replay reports the first divergence; forks replay a cached prefix.
- **Findings.** One worked run (671 events); two re-runs byte-identical. No task evaluation.
- **Decision.** D5 journal design: content-addressed response store keyed by the canonical request hash (incl. context-manifest hash, model ref, decoding parameters); first-divergence replay; fork-from-ledger for MOTO branches. Its scriptless reactive control is not adopted; legal work needs explicit gates.

#### Effective context engineering for AI agents (2025)
`COM · [V-read]` · Rajasekaran et al. (Anthropic) · [link](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- **Findings.** Smallest high-signal token set; non-overlapping tools; just-in-time retrieval with a hybrid pre-load for legal; compaction; clean-context sub-agents returning 1,000–2,000-token summaries.
- **Decision.** Compaction as a ledgered `CompactionSummary` never promoted to the case graph; run-scoped scratch notes; fan-out returns typed summaries ≤2,000 tokens with evidence ids; small pre-loaded matter header (parties, forum, stage, governing dates, open gates).

### 3.3 Agent topology (D6, D14)

**Decision.** One generating agent with tools plus an independent runtime verifier from a different model family. Fan-out only for decomposable work (searching N sources, summarising M exhibits). Sequential legal reasoning stays with one agent. Role specs are typed task contracts with termination conditions, written as Tasks–Competences–Responsibilities profiles (LaMAS4PD) mapped to Read/Prepare/Commit.

#### Kim, Gu, Park, et al. — "Towards a Science of Scaling Agent Systems" (2025)
`PP · [V]` · arXiv [2512.08296](https://arxiv.org/abs/2512.08296v1)
- **Method.** 260 configurations, 6 benchmarks, 5 architectures, 3 LLM families, compute standardised.
- **Findings.** Relative performance from +80.8% (decomposable financial reasoning) to −70% (sequential planning); architectures without centralised verification propagate more errors.
- **Decision.** D14.

#### Cemri et al. — "Why Do Multi-Agent LLM Systems Fail?" (MAST) (2025)
`PR · [V]` · NeurIPS 2025 D&B · arXiv [2503.13657](https://arxiv.org/abs/2503.13657v3)
- **Findings.** 14 failure modes in three categories (system design, inter-agent misalignment, task verification); κ = 0.88 on 150 traces; failures need design fixes.
- **Decision.** The runtime verifier targets MAST's task-verification category; the Eval agent tags sampled traces with MAST labels.

#### Zhang, Yin, et al. — "Which Agent Causes Task Failures and When?" (Who&When) (2025)
`PR · [PK]` · ICML 2025 · arXiv [2505.00212](https://arxiv.org/abs/2505.00212)
- **Findings [PK].** ~53.5% agent-level and ~14% step-level attribution accuracy.
- **Decision.** Do not rely on automated root-cause analysis; keep deterministic replay from the SQLite journal with context manifests.

**Practitioner corroboration** (`COM · [PK]`): Anthropic "Building effective agents" (Dec 2024); Cognition "Don't Build Multi-Agents" (Jun 2025); Anthropic multi-agent research system (breadth-first gains at high token cost). Parallel agents for breadth, a single agent for depth.

### 3.4 Harness evaluation and the W13 Verifier/Eval agent (D15)

#### The Scaffold Effect in Coding Agents (2026)
`PP · [V-abs]` · Vats, Golev · arXiv [2607.22585](https://arxiv.org/abs/2607.22585)
- **Findings.** Same models across Goose, OpenCode, OpenHands: up to **40× token differences per solved task**; pass rates within 0–8 pp.
- **Decision.** Eval reports pin model × harness version × config hash and tokens per solved task.

#### Harness-Bench (2026)
`PP · [V-abs]` · Yao et al. · arXiv [2605.27922](https://arxiv.org/abs/2605.27922)
- **Findings.** 106 offline tasks, 5,194 trajectories; results depend on pairing; names "execution-alignment failures" (reasoning drifts from tool output or workspace state).
- **Decision.** The Eval agent measures execution alignment: draft claims that differ from what the verifier returned, computed from the ledger.

#### Liu, Stammbach, Henderson — "Who Checks the Citations?" (LePhantomCite) (2026)
`PP · [V]` · arXiv [2606.21155](https://arxiv.org/abs/2606.21155)
- **Method.** Five error types from real filings (non-existent citation, case-name mismatch, incorrect pincite, verbatim misquote, content misrepresentation) injected into 1,300 federal appellate brief excerpts plus 300 items from Dahl et al.
- **Findings.** Agentic GPT-5: 84.4% recall, 55.0% F1, 15.3 tool steps per excerpt; 100% recall on non-existent citations but **18.2% on pincites**, attributed to missing pagination.
- **Decision.** The planted-defect methodology for the Eval agent's CVS suite; budget ~15 steps per excerpt for agentic checks; report against this benchmark as an external yardstick.

#### Magesh, Surani, Dahl, Suzgun, Manning, Ho — "Hallucination-Free?" (2024)
`PP · [V]` · arXiv [2405.20362](https://arxiv.org/abs/2405.20362)
- **Findings.** Commercial legal research tools hallucinated in 17–33% of queries; a response is hallucinated if *incorrect* **or** *misgrounded*.
- **Decision.** Correctness and groundedness are separate verdict axes; preregistered, independent evaluation is the template for the Eval agent and the external lawyer panel.

**Evaluation process references.** Vals AI VLAIR Legal Research (Oct 2025, `COM · [V]`): blind, consortium-graded, published-rubric evaluation; template for our external panel with "verifiability" as its own axis. Harvey BigLaw Bench (`COM · [V-link]`): rubric scoring with hallucination and sourcing penalties. LLM-as-judge bias work (MT-Bench [2306.05685](https://arxiv.org/abs/2306.05685); "Judging the Judges" [2406.12624](https://arxiv.org/abs/2406.12624)): validate every judge against lawyer labels (Cohen's κ on ≥200 items per claim type), randomise candidate order, never let the generator's family judge its own output.

### 3.5 W5 citation verification at the paragraph (D23, D24)

**Decision.** CVS verifies three levels, reported separately: **identity** (citation parses and resolves to one judgment; parallel citations equivalent), **pinpoint + quote** (paragraph exists; quoted string present after normalisation), **proposition support** (on the pinpointed paragraph ± 1 only, never the whole judgment). Technical outcome (resolved, fetch failed, source unavailable, outside corpus coverage) and semantic outcome (supports, partial, contradicts, not checked) are separate axes; a citation outside the corpus is `unresolved: outside_corpus_coverage`, never failed. Resolution order T1 SC official (lawyer solves CAPTCHA in the built-in browser; harness captures and hashes) → T2 AWS Open Data mirror → T3 Indian Kanoon via webfetch or API; the source of each step is recorded and feeds `verificationSteps[]` in the Reg 43(4) manifest.

#### Verma — "Is this Citation on Point?" (2026)
`PP · [V]` · arXiv [2608.12571](https://arxiv.org/abs/2608.12571)
- **Method.** Real US citations corrupted by swapping the case or only the pinpoint page; 14 model configurations.
- **Findings.** Wrong-case caught 93–100%; wrong-pinpoint only 37–61% on opinions and 52–83% on briefs, because models accept "topical overlap rather than page-level support". GPT-5.4 at high effort still misses 40% on opinions. A "verify at the cited page" prompt raises recall and false positives.
- **Decision.** Level 3 sees only the pinpointed paragraph.

#### Dahl, Magesh, Suzgun, Ho — "Large Legal Fictions" (2024)
`[V]` · arXiv [2401.01301](https://arxiv.org/abs/2401.01301)
- **Findings.** 69–88% hallucination on verifiable US federal case questions (2023 models); poor calibration; contra-factual bias toward false premises.
- **Decision.** Never expose raw generator confidence; false premises in a lawyer's query are a test class.

#### AttributionBench (2024)
`PP · [V-link]` · arXiv [2402.15089](https://arxiv.org/abs/2402.15089)
- **Findings.** NLI models and GPT-4 reach ~80% macro-F1; failures concentrate on fine-grained partial support.
- **Decision.** Decompose propositions into conditions and qualifiers; "dropped qualifier" is a planted-defect class (maps to Clef `scope_match`, §5).

**Supporting.** LegalCiteBench (ICML 2026, `[V-link]`, results not verified): read before the CVS validation plan is final.

**Inference.** Verma's and LePhantomCite's failures have the same cure: a deterministic passage identity `(document_id, version, para_no, char_span)` and a verifier that sees only that passage. *Greenopolis* (§6.3) cited "para 73" of a 27-paragraph judgment; a paragraph-count gate catches it with no model involved.

### 3.6 Temporal law and point-in-time authority (D26, Stage 4)

**Decision.** Each issue gets computed governing dates (offence date decides IPC or BNS; cause-of-action date; filing date for procedure). Statute retrieval filters on `valid_from ≤ governing_date < valid_to`; the verifier checks every cited provision's version against the governing date. Statutes are a Work with dated Expressions and first-class Amendment Actions (Akoma Ntoso optional, D29). The IPC→BNS, CrPC→BNSS and Evidence Act→BSA transition (in force 1 July 2024 [PK]) makes this a day-one requirement for criminal matters.

#### Prior, Schultz, Grabmair — "Asking For An Old Friend: Diagnosing and Mitigating Temporal Failure Modes in LLM-based Statutory Question Answering" (2026)
`PP · [V]` · arXiv [2605.23497](https://arxiv.org/abs/2605.23497)
- **Method.** 312 expert-validated time-sensitive German statutory QA pairs; five LLMs; vanilla, web search, two RAG variants with fact-date extraction and version filtering.
- **Findings.** Two failure modes: post-cutoff staleness and **recency bias** (preferring the newer provision where the older governs). Web search strengthens recency bias; date-filtered RAG improves every category.
- **Limitations.** German law; numbers not in the abstract.
- **Decision.** Governing-date filter as a hard constraint; BNS/BNSS/BSA mapping errors as a planted-defect class.

#### de Martim — "An Ontology-Driven Graph RAG for Legal Norms" (SAT-Graph RAG) (2025)
`PR (likely) · [V]` · arXiv [2505.00039](https://arxiv.org/abs/2505.00039v5) · DOI 10.3233/FAIA251598
- **Method.** Works vs versioned Expressions; temporal states reuse unchanged component versions; legislative events as Action nodes; deterministic point-in-time, impact and provenance queries.
- **Limitations.** Qualitative; one legal system.
- **Decision.** Template for the statute layer, mapped onto relational tables and FRBR identifiers.

**Corroborating.** TimeQA ([2108.06314](https://arxiv.org/abs/2108.06314), `[PK]`); TempReason ([2306.08952](https://arxiv.org/abs/2306.08952), `[PK]`): LLMs weakest at event–event ordering, so chronology ordering is computed in code from normalised dates. Time-sensitive RAG datasets ([2508.12282](https://arxiv.org/abs/2508.12282v1); MRAG [2412.15540](https://arxiv.org/abs/2412.15540), `[V-link]`): dense retrievers ignore temporal constraints.

**Precedent validity.** Overruled precedent ("good law as of date X") is the case-law counterpart. No Indian citator dataset exists (§9). RTS requires that "overruled" is recorded only with an anchored overruling passage and a bench-strength and date check.

### 3.7 Context, retrieval and document identity (D17, D25)

**Decision.** Each step gets a small curated context: retrieved spans with anchor IDs plus structured case-graph facts. Insufficient evidence widens retrieval rather than adding raw text. Every assembled context yields a content-addressed context manifest. Long judgments and record volumes are processed by map-style passes over structure-aware sections. Every chunk carries a deterministic metadata prefix (court, coram, date, neutral citation, case type, rhetorical role) plus a hashed document-level summary; document-level retrieval mismatch (DRM) is a first-class metric. Retrieval is SQLite FTS5 (BM25 with Indian legal tokenisation: "u/s 439", section numbers, Roman numerals) plus sqlite-vec, fused with RRF.

#### Modarressi et al. — "NoLiMa: Long-Context Evaluation Beyond Literal Matching" (2025)
`PR · [V]` · ICML 2025 · arXiv [2502.05167](https://arxiv.org/abs/2502.05167)
- **Findings.** Of 13 LLMs claiming ≥128K context, 11 fall below 50% of their short-context baseline at 32K when needle and question share little vocabulary; GPT-4o 99.3% → 69.7%.
- **Decision.** Retrieval-first contexts; paraphrased-needle regression tests on synthetic matter files (fact stated in a witness's words, asked in statutory words).

#### Chroma — "Context Rot" (2025)
`COM · [V]` · [link](https://www.trychroma.com/research/context-rot)
- **Findings.** 18 LLMs degrade with input length even on simple tasks; one distractor hurts; ~300-token focused prompts beat ~113k-token full prompts on LongMemEval.
- **Decision.** Short structured blocks (passage + anchor ID + as-of date); context ordered stable → volatile for cache hits.

#### Reuter et al. — "Towards Reliable Retrieval in RAG Systems for Large Legal Datasets" (2025)
`PP (likely NLLP 2025) · [V]` · arXiv [2510.06999](https://arxiv.org/abs/2510.06999v1)
- **Findings.** Summary-augmented chunking greatly reduces DRM; a *generic* summary prompt beat a legal-expert prompt.
- **Decision.** Summaries are versioned, hashed derived artefacts (generated once, regenerable, never silently edited), so retrieval stays reproducible. Templated Indian orders (two bail orders in one FIR; review and curative orders with identical cause titles) are the expected DRM case.

**Corroborating long-context work** (`[PK]`, re-check before quoting): RULER ([2404.06654](https://arxiv.org/abs/2404.06654)); BABILong ([2406.10149](https://arxiv.org/abs/2406.10149)): models use ~10–20% of context for multi-fact reasoning; LongBench v2 ([2412.15204](https://arxiv.org/abs/2412.15204)); "Lost in the Middle" ([2307.03172](https://arxiv.org/abs/2307.03172)).

**Contrary evidence.** Self-Route ([2407.16833](https://arxiv.org/abs/2407.16833), EMNLP 2024 Industry, `[PK]`): long-context models beat RAG on average. Its benchmarks are lexically matched; legal questions are paraphrastic. We keep its self-assessment step and replace "fall back to long context" with "widen retrieval".

**Retrieval baselines.** CLERC ([2406.17186](https://arxiv.org/pdf/2406.17186)) and COLIEE 2023 ([PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11026282/)): BM25 competitive with dense retrievers on long legal queries [PK]. Supports strong FTS5 BM25 under the hybrid.

### 3.8 Graphs, ontology and the case graph (D17, D29)

**Decision.** The graph is justified for statute structure and point-in-time versions, typed citation-treatment edges, and statute ↔ case links. It is not an LLM-extracted everything-store. Plain typed edge tables (`edges(src, type, dst, valid_from, valid_to, recorded_at, prov_ref)`) in SQLite with recursive CTEs; no graph database. Two layers: a reference layer (SC/HC judgments keyed by INSC and CNR, statutes, bench registry; versioned, read-only to agents) and a matter layer (agent-writable through compiled tools, may only *link* into reference nodes). Caption metadata comes from the AWS Open Data parquet fields (title, petitioner, respondent, judge, author_judge, citation, case_id, cnr, decision_date, disposal_nature, nc_display, path) and the HC dataset, not from extraction; LLM extraction is spent on body propositions and treatment. The ontology grows only through written competency questions with tests.

#### Jain, Harde, Mihindukulasooriya, Ghosh, Dubey, Bisht — "Constructing a Knowledge Graph from Indian Legal Domain Corpus" (TEXT2KG 2022)
`PR-workshop · [V-read]` · Text2KG at ESWC 2022, CEUR-WS · code https://github.com/semintelligence/Text2KG
- **Method.** 44,366 SC judgment texts from Indian Kanoon; GATE/ANNIE + JAPE rules; caption-block relation mapping; RDF triples; 16 entity labels; six competency questions.
- **Findings.** Gold set of 5 documents, double-annotated with adjudication (363 entities, 154 triples). NER precision ≈1.0, recall 0.18–0.78 per document (LAW 0.19, COURT_DECISION 0.1, DATE 1.0); relation F1 0.28–0.60. Annotation ≈1 hour per 100 documents.
- **Limitations.** Tiny gold set; no INSC or CNR identifiers; aggregator text, not the court copy; no span provenance; rule-based.
- **Decision.** Caption fields are rule-tractable but better taken from metadata (D29). Its annotation protocol (two annotators + adjudicator) is scaled to a ≥50-judgment INSC-keyed golden set for the Eval agent; its competency questions seed ontology tests.

#### Recker, Hensen, Keuper, Schuh — LaMAS4PD (2026)
`PR · [V-read]` · Procedia CIRP 142 (2026) 274–279 · DOI [10.1016/j.procir.2026.05.260](https://doi.org/10.1016/j.procir.2026.05.260)
- **Method.** Agents designed through TCR profiles: extraction, semantic linking, synthesis before persisting; KG with static expert layers and a dynamic auto-populated layer.
- **Findings.** Synthetic data; qualitative; larger models link better.
- **Decision.** Reference/matter layering; extract → link → validate → commit order; the LLM synthesis agent is replaced by the deterministic kernel (D10). TCR profiles document agent accountability (draft Reg 8(2)).

#### Rasmussen et al. — Zep: A Temporal Knowledge Graph Architecture for Agent Memory (2025)
`PP · [V-abs]` · arXiv [2501.13956](https://arxiv.org/abs/2501.13956)
- **Findings.** Bi-temporal KG memory; DMR 94.8% vs 93.4% MemGPT; LongMemEval up to +18.5%. Vendor-authored.
- **Decision.** `valid_from/valid_to + recorded_at` on statements and authorities; edge invalidation on contradiction is proposed to the lawyer, never applied silently.

#### Lippolis et al. — OntoExtend (2026)
`PP · [V-abs]` · arXiv [2607.17963](https://arxiv.org/abs/2607.17963)
- **Findings.** 39 CQs; fragments passed functional tests; engineers rated output "minor to moderate revision".
- **Decision.** Ontology change process: competency questions from lawyers → drafted schema fragment → tests → human review. The LLM drafts only.

#### "When to use Graphs in RAG" (GraphRAG-Bench) (2025–2026)
`PR · [V]` · ICLR 2026 · arXiv [2506.05690](https://arxiv.org/abs/2506.05690)
- **Findings.** GraphRAG "frequently underperform[s] vanilla RAG"; maps when graphs help.
- **Decision.** Any graph-retrieval claim is shown on our eval set against the hybrid baseline.

#### IL-TUR statute identification: LeSICiN (2024)
`PR · [V]` · ACL 2024 · arXiv [2407.05399](https://arxiv.org/html/2407.05399v2)
- **Findings.** Graph-based LeSICiN best on Indian statute identification at 28.08 macro-F1; GPT-3.5/4 ~20–24%.
- **Decision.** Keep statute ↔ case edges; section mentions are extracted deterministically and mapped through official IPC↔BNS correspondence tables, never by a statute-identification model.

#### Goel et al. — "Domain-Partitioned Hybrid RAG for Legal Reasoning … for India" (2026)
`PP · [V-read]` · arXiv [2602.23371](https://arxiv.org/abs/2602.23371)
- **Findings.** Hybrid KG + RAG 6.09 (70% pass) vs 4.16 (37.5%) on a 40-question LLM-judged benchmark; per-retriever recall at k = 5 of 0.14–0.58; arithmetic errors in reported means; IPC only.
- **Decision.** No reliable support for KG gains; an evaluation anti-pattern. Our evaluation uses gold-set recall@20, never LLM-judge pass rate alone.

**Reading.** Graph-based Agent Memory survey ([2602.05665](https://arxiv.org/abs/2602.05665), `[V-abs]`): checklist for memory update, forget and conflict.

### 3.9 Selective prediction and verifier agreement (D16)

**Decision.** Agreement between verifiers is a selective-prediction policy. (1) Deterministic checks veto; they are not votes. (2) Verifier families are heterogeneous by construction (deterministic code, an encoder NLI checker, a decoder judge from a different lab than the generator, Jev/Clef scorers), and pairwise error correlation is measured (Cohen's κ on the planted-defect set). (3) Each scorer is calibrated separately on a lawyer-labelled Indian set (isotonic or Platt). (4) Thresholds are set per claim type by conformal risk control so that P(error | auto-pass) ≤ α (≈2% citations and negative treatments, 5% Notebook facts), producing three bands: auto-pass, UNRESOLVED (lawyer), fail. (5) Four states: SUPPORTED, CONTRADICTED, NOT_FOUND (emitted only by retrieval and gates), UNRESOLVED.

#### Mohri & Hashimoto — conformal factuality (2024)
`PR · [V-link]` · ICML 2024 · arXiv [2402.10978](https://arxiv.org/abs/2402.10978)
- **Findings.** Back off low-confidence sub-claims until a target correctness level holds; 80–90% guarantees retaining most content. Assumes exchangeability, broken by a new forum, workflow or model update.
- **Decision.** Per-type thresholds; recalibrate on distribution shift and whenever prompt wording changes.

**Corroborating.** Cherian, Gibbs, Candès ([2406.09714](https://arxiv.org/abs/2406.09714)): conditional guarantees per subgroup (court tier, claim type). Geifman & El-Yaniv 2017 ([1705.08500](https://arxiv.org/abs/1705.08500), `[PK]`): risk–coverage curves; UNRESOLVED is the rejection option. Kamath, Jia, Liang 2020 (ACL, `[PK]`): softmax abstention degrades under shift; trained calibrators help, so recalibrate per court tier and document-quality band. Kadavath et al. 2022 ([2207.05221](https://arxiv.org/abs/2207.05221), `[PK]`): calibration is domain- and format-specific. "Know Your Limits" ([2407.18418](https://arxiv.org/abs/2407.18418)): abstention taxonomy.

#### MiniCheck (2024)
`[V-link]` · arXiv [2404.10774](https://arxiv.org/abs/2404.10774)
- **Findings.** Small fact-checkers reach GPT-4-level accuracy on LLM-AggreFact at ~400× lower cost. No Indian legal English benchmark.
- **Decision.** MiniCheck-class encoder as the non-Qwen heterogeneous scorer beside Clef, measured on Indian text before relied on.

### 3.10 W10 review interface and automation bias (Stage 2, D19)

**Decision.** (1) Every claim shows its source span inline, one click from the paragraph and line. (2) Evidence plus verdict, not long prose rationales. (3) Unresolved items in first-person specific language ("I could not confirm that para 14 supports this"), A/B-tested with advocates. (4) Cognitive forcing only at high-stakes gates (filing-ready export, adverse-authority sign-off, limitation computation): the lawyer records a call before seeing the AI verdict. (5) Show what was not checked. (6) A per-task frontier map from Eval-agent results. (7) AI revision of a lawyer's draft only as opt-in tracked changes. Displayed confidence comes from calibrated verifier scores, never from generator prose; no numeric probabilities until per-type calibration is validated. Telemetry: acceptance rate stratified by verifier outcome; reverted AI edits; seeded canary claims.

| Work | Tags | Finding | Design use |
|---|---|---|---|
| Vasconcelos et al. 2023, "Explanations Can Reduce Overreliance…" ([2212.06823](https://arxiv.org/abs/2212.06823)) | CSCW · [PK] | Explanations reduce over-reliance when they lower verification cost | Span-linked evidence is the primary explanation |
| Bansal et al. 2021, "Does the Whole Exceed its Parts?" ([2006.14779](https://arxiv.org/abs/2006.14779)) | CHI · [PK] | Explanations raised acceptance regardless of correctness | Short, secondary rationales |
| Buçinca, Malaya, Gajos 2021, "To Trust or to Think" ([2102.09692](https://arxiv.org/abs/2102.09692)) | CSCW · [PK] | Cognitive forcing cut over-reliance; disliked by users | Forcing only at high-stakes gates |
| Kim, Liao et al. 2024, "I'm Not Sure, But…" ([2405.00623](https://www.arxiv.org/abs/2405.00623)) | FAccT · [V] | First-person uncertainty raised accuracy (n = 404) | First-person specific UNRESOLVED wording |
| Steyvers et al. 2025, "What LLMs Know and What People Think They Know" ([2401.13835](https://arxiv.org/abs/2401.13835)) | Nat. Mach. Intell. · [V-link] | Users overestimate LLM accuracy; aligning language to model confidence narrows the gap | Three-state display from verifier scores |
| Parasuraman & Manzey 2010; Goddard et al. 2012 | Human Factors; JAMIA · [PK] | Automation bias affects experts; omission vs commission errors; accountability mitigates | Show coverage gaps; record who decided and what they saw |
| Choi & Schwarcz 2023; Choi, Monahan, Schwarcz 2024 | SSRN; Minn. L. Rev. · [V-link] | GPT-4 helped weak students, slightly hurt strong; speed gains | Gains claimed per task type only |
| Schwarcz et al. 2025, "AI-Powered Lawyering" (SSRN 5162111) | TR · [V] | Legal RAG and reasoning models improved quality; productivity +50–130% | Grounded retrieval plus reasoning model |
| Bednar, Cleveland, Erbsen, Schwarcz 2026 (SSRN 6525800) | TR · [V-sec] | AI revision helped weak memos, often worsened strong ones | Opt-in, diff-based revision |
| Dell'Acqua et al. 2023, "Jagged Technological Frontier" (SSRN 4573321) | TR · [V-sec] | Outside-frontier task accuracy fell 84.5% → 70.6% / 60.0% with AI | Frontier map; independent lawyer analysis on out-of-frontier tasks (e.g. implied overruling) |

Limits: all legal RCTs use US law students on short tasks; none tests Indian advocates or multi-day matters (§9).

### 3.11 W11 Case Conference, argumentation and debate (D26, D6)

**Decision.** The Case Conference is a structured, human-chaired, multi-role review of issues and arguments, not an autonomous debate whose conclusion is trusted. Controls: commit-before-see (each role writes before reading others); stance locking (opposing counsel scored on finding defeaters); an evidence-only judge whose verdict on each attack is checked against vault spans and the argument framework; heterogeneous model families for adversarial roles; 2–3 rounds with answer flips logged (a flip without new evidence is a red flag); no majority vote. UNRESOLVED is a first-class outcome. The argument map is a typed bipolar graph compatible with AIF (I-nodes, RA-nodes with Walton schemes and critical questions, CA-nodes typed rebut/undercut/undermine, PA-nodes encoding bench strength, *lex posterior*, *lex specialis*, binding vs persuasive). Argument status is computed by argumentation semantics, never asserted by an LLM; unanswered critical questions become the weak-points report.

| Work | Tags | Finding | Design use |
|---|---|---|---|
| Wynn, Satija, Hadfield 2025 ([2509.05396](https://arxiv.org/abs/2509.05396v2)) | PP · [V-link] | Debate can be harmful; correct→incorrect flips favouring agreement | Commit-before-see, stance locking, flip logging |
| "Should we be going MAD?" 2023 ([2311.17371](https://arxiv.org/abs/2311.17371)) | PP · [PK] | Debate does not reliably beat compute-matched self-consistency | Compute-matched baselines in Case Conference evaluation |
| "Peacemaker or Troublemaker" 2025 ([2509.23055](https://arxiv.org/html/2509.23055v1)) | PP · [V-link] | Sycophancy drives premature consensus | Heterogeneous family for opposing counsel |
| Zhang, Nadeem, Zheng, Stammbach, Henderson 2026, moot court simulator ([2603.04718](https://arxiv.org/abs/2603.04718)) | PP · [V-link] | High issue recall, low question diversity, sycophancy toward the advocate | Evaluate on issue recall, diversity and sycophancy rate |
| Du et al. 2023; Khan et al. 2024; ChatEval | [PK] | Debate helps with extra compute or information asymmetry; diverse roles matter | Asymmetry (roles see evidence, judge checks spans) is kept |
| Zhang, Grabmair, Gray, Ashley 2025, factor-based distinguishing ([2510.08710](https://arxiv.org/abs/2510.08710)) | PP · [V-link] | LLMs collapse to 11.46–33.99% on integrated precedent analysis | Formal layer is the backstop; Factor/Case/`distinguishable_by` nodes in the data model |
| Freedman et al. ArgLLMs ([2405.02079](https://arxiv.org/abs/2405.02079)) | AAAI 2025 · [V-link] | LLM builds a QBAF; gradual semantics decides; contestability | DF-QuAD ranking of grounds; recomputation on lawyer edit |
| Dung; ASPIC+; Carneades; Walton; HYPO/CATO; ANGELIC; PyArg | F · [PK] | Defeat semantics, proof standards and burdens, schemes, factor CBR | ASPIC+ defeat; Carneades standards (bail prima facie vs conviction appeal); CBR comparison |
| TCS ILP argument extractor (ArgMining 2023); LREC 2022 support/attack dataset | [V-link] | Indian argument mining γ = 0.405, Arg-exact F1 0.167 | Evaluate arguments at issue level by two lawyers |

### 3.12 W12 MOTO engine: generate–validate–prune loops (D27, D6 Pattern C)

**Decision.** MOTO is a separate module that generates candidate arguments, validates them through staged gates, and feeds survivors into the Studio for lawyer accept/reject. It ports the shape of the MOTO repository loop (C2) with three changes from the literature: a **quality-diversity archive** keyed by ground type (jurisdictional, procedural, evidentiary, sentencing, constitutional) × stance × authority tier, so the loop does not collapse onto the obvious ground; **pairwise Elo tournaments** per scoring axis instead of absolute 1–10 scores, plus proximity clustering against near-duplicates; **typed rejection reasons** stored in the ledger (last 5 per generator) as verbal memory. The repository's single LLM novelty validator and keyword contradiction checker are replaced by the CVS/RTS staged gates and Jev/Clef scoring; selection within a cell stays with the lawyer.

| Work | Tags | Design use |
|---|---|---|
| Google AI co-scientist ([2502.18864](https://arxiv.org/abs/2502.18864)) | PP · [V-link] | Generation, reflection, Elo ranking, evolution, proximity, meta-review written into playbook config |
| AlphaEvolve ([2506.13131](https://arxiv.org/abs/2506.13131)); FunSearch (Nature 2023); MAP-Elites ([1504.04909](https://arxiv.org/abs/1504.04909)) | [PK] | Quality-diversity archive; legal correctness lacks an automatic evaluator, so fitness is staged validation plus the lawyer |
| Self-Refine; Reflexion ([2303.11366](https://arxiv.org/abs/2303.11366)); Tree-of-Thoughts | [PK] | Typed rejection memory without training |
| STORM; Co-STORM ([2408.15232](https://arxiv.org/abs/2408.15232)) | [PK] | Perspective-guided question generation for research breadth in the Studio |
| Concordia ([2312.03664](https://arxiv.org/abs/2312.03664)) | [PK] | A deterministic "game master" owns state and validates typed actions (Case Conference chair logic) |

### 3.13 Outcome prediction: excluded

**Decision.** No win probabilities, per-judge outcome rates, bail-outcome prediction or party-conduct prediction. The Studio and Case Conference output issues, objections, weak points and procedural risks. This is also a regulatory boundary: draft Reg 20(1)(d) bars risk scoring and 20(1)(f) bars predicting the conduct of parties, witnesses or legal representatives, both non-derogable (Reg 56).

Evidence: Medvedeva, Wieling & Vols (AI & Law) and Medvedeva & McBride (NLLP 2023): most "prediction" classifies post-decision text. ILDC/CJPE ([2105.13562](https://arxiv.org/abs/2105.13562)): 81.31 macro-F1 with leakage. NyayaRAG ([2508.00709](https://arxiv.org/abs/2508.00709), `[V-read]`): facts-only input 51.13% (≈ chance); statutes in context 67.07%; weak support for placing the governing provision first in statutory task contexts. Zambrano 2025 ([2507.13732](https://arxiv.org/abs/2507.13732)): judge-specific models reach 92.85% F1 — technical feasibility is why it is excluded (cf. France, Art. 33, Justice Reform Act 2019).

### 3.14 Untrusted content, plugins and security (D21, D22, D32)

**Decision.** Every path ingesting untrusted content (court pages, opposing PDFs, browser captures, third-party tool output) uses: a reader model with no tools producing typed events labelled untrusted; the acting plan fixed before untrusted data is seen; untrusted values only in typed slots validated against regexes and the case graph; confidentiality and integrity labels propagated per value; external effects only through the outbox and a lawyer gate; skills and playbooks signed and hash-pinned. Third-party MCP servers run out of process at Read/Prepare tier only, with pinned, hashed manifests; descriptions are untrusted. The browser pane uses per-matter session partitions; the lawyer solves CAPTCHAs; nothing is submitted autonomously.

| Work | Tags | Finding | Design use |
|---|---|---|---|
| CaMeL, "Defeating Prompt Injections by Design" ([2503.18813](https://arxiv.org/abs/2503.18813)) | PP · [V] | 77% of AgentDojo tasks with provable security vs 84% undefended | Privileged planner never reads untrusted data; Indian legal-mail red-team set |
| Beurer-Kellner et al., "Design Patterns for Securing LLM Agents" ([2506.08837](https://arxiv.org/abs/2506.08837)) | PP · [V-link] | Six patterns; untrusted input must not trigger consequential actions | Map-reduce reading, one item per reader call |
| FIDES ([2505.23643](https://arxiv.org/abs/2505.23643)) | PP · [V-link] | Label-tracking planner with deterministic policy | Data labels and egress rules (D32) |
| MCP Security Bench ([2510.15994](https://arxiv.org/abs/2510.15994)) | PP · [V-abs] | 12 attack types, 405 tools, 2,000 attacks; more capable agents often more vulnerable | Run MSB against the tool gateway before enabling third-party MCP servers |
| Brave (Comet, unseeable injections); OpenAI Atlas hardening; OpenClaw heartbeat chain; Willison "lethal trifecta" | COM · [V]/[PK] | Screenshot and hidden-HTML injection; remote content becomes trusted by moving into workspace files | Every capture is untrusted data; workspace files written by fetched content are never executable instructions |

### 3.15 W9 ledger and provenance (D18, D31)

**Decision.** Local append-only hash chain: RFC 8785 canonical JSON + SHA-256 with Ed25519-signed checkpoints (local key), RFC 3161 timestamps where online, in-toto/DSSE envelopes for the AI-origin manifest and verification receipt, PROV-O export. The dossier ships the SHA-256 of every source file (as received and normalised), an open offline verifier and a pre-filled BSA s.63(4) certificate (*Pune Bar Assn.*, §6.3). Witnessed Merkle checkpoints are P1.

| Work | Tags | Design use |
|---|---|---|
| Crosby & Wallach 2009, "Efficient Data Structures for Tamper-Evident Logging" | USENIX · [PK] | A chain gives O(n) prefix proofs; Merkle logs give O(log n) — the reason witnessing is added in P1 |
| RFC 9162 Certificate Transparency 2.0 | POL · [PK] | Normative proof format for P1 |
| Schneier & Kelsey 1999, "Secure Audit Logs" | TISSEC · [PK] | Forward-secure entries if written on less-trusted nodes |
| PROV-AGENT ([2508.02866](https://arxiv.org/abs/2508.02866)) | PP · [V] | AIAgent, AgentTool, AIModelInvocation, Prompt, Response as PROV subclasses in the export vocabulary; sentence-level PROV for legal drafting appears novel |
| W3C PROV-O; RFC 3161; in-toto/DSSE | POL · [PK] | Export, timestamp and envelope formats |

---

## 4. Techniques by topic

### 4.1 Legal retrieval and QA benchmarks: smoke tests and metric definitions

No public benchmark measures our actual promise (every sentence in an Indian filing traces to a source). External benchmarks serve as smoke tests and metric sources.

| Benchmark | Link | Use |
|---|---|---|
| LegalBench-RAG | [2408.10343](https://arxiv.org/abs/2408.10343) | Span precision/recall as the primary retrieval metric, paired with DRM |
| LegalBench | [2308.11462](https://arxiv.org/abs/2308.11462) | Rubric ideas for issue spotting and rule application |
| LePaRD | [2311.09356](https://arxiv.org/abs/2311.09356) | Passage-level precedent retrieval analogue |
| COLIEE case entailment (2023 overview; NOWJ 2025/2026 systems) | [PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11026282/) | External smoke test for CVS level 3 |
| FIRE 2019 AILA; IL-TUR PCR and LSI | CEUR-WS Vol-2517; [IL-TUR](https://exploration-lab.github.io/IL-TUR/) | Indian retrieval yardsticks (nDCG@10, Recall@50 vs BM25-only and dense-only) |
| CaseHOLD | [2104.08671](https://arxiv.org/abs/2104.08671) | Template for an Indian "which holding does this citation rely on" task |
| Bar Exam QA / Housing Statute QA | [2505.03970](https://arxiv.org/abs/2505.03970) [PK] | Supports query rewriting and issue decomposition before retrieval |
| LRAGE | [2504.01840](https://arxiv.org/pdf/2504.01840) | Reference for the retrieval eval harness structure |

### 4.2 Retrieval components

Foundational components (`[PK]`): BM25; Reciprocal Rank Fusion (Cormack et al. 2009); BGE-M3 ([2402.03216](https://arxiv.org/abs/2402.03216)) dense/sparse/multi-vector; SPLADE; ColBERT/ColBERTv2/PLAID; late chunking ([2409.04701](https://arxiv.org/abs/2409.04701)); RAG ([2005.11401](https://arxiv.org/abs/2005.11401)). Design use: FTS5 BM25 + sqlite-vec dense vectors (BGE-M3 class, local) fused with RRF, optional local reranker; every hit resolves to (blob SHA-256, page, paragraph); chunks follow legal structure (numbered paragraphs, statute sub-sections). Late chunking and summary augmentation are compared on DRM. HippoRAG-style traversal is tested only on the citation graph and statute ↔ case links; community-summary GraphRAG is not used (untraceable summaries).

### 4.3 Information extraction from Indian legal documents

Label schemes and baselines for evaluation and weak supervision of extraction prompts; never for training.

| Work | Finding | Design use |
|---|---|---|
| Kalamkar et al. 2022, rhetorical roles corpus (LREC; [2201.13125](https://arxiv.org/abs/2201.13125v2)) | 13 labels incl. Facts, Argument by Petitioner/Respondent, Analysis, Ratio, Ruling; IL-TUR RR best 69.01 macro-F1 | **A proposition attributed to "the Court held" must be supported by a Ratio or Analysis span, never by counsel's argument** — applied as a verifier feature with lawyer review (matches Clef `voice`, §5); chunk prefixes; section-wise processing |
| Kalamkar et al. 2022, legal NER ([2211.03442](https://arxiv.org/abs/2211.03442)) | 14 entity types; IL-TUR best 48.58 strict F1 | Candidate generator for case-graph entities and citation resolver input |
| SemEval-2023 Task 6 LegalEval ([2304.09548](https://arxiv.org/abs/2304.09548)) | ≈0.8 RR / 0.9 NER micro-F1 [PK] | Report macro and strict on our held-out set |
| Bhattacharya et al. 2019; Malik et al. 2022 | Alternative RR schemes | Comparison when fusing heading heuristics, RR votes and LLM checks |
| U-CREAT (ACL 2023, [2307.05260](https://arxiv.org/abs/2307.05260)) | Event representations beat BM25/dense on IL-PCR; best 39.15 µF1@K | Store (actor, action, object, date) events as passage annotations for chronology and retrieval |
| IL-TUR (ACL 2024) | Eight tasks; "far from solved" | External evidence for NER, RR, LSI, PCR components |
| InLegalBERT ([2209.06049](https://arxiv.org/abs/2209.06049)) | Indian legal encoder | Optional weak feature provider |
| LexChronos ([2603.01651](https://arxiv.org/abs/2603.01651)) | Timeline extraction; BERT-F1 0.875 on synthetic data | LLM extracts (event, date expression, span); code normalises and orders |
| LeGen (NLLP 2024) | Generative legal relation extraction | Reference for typed case-graph edges |

### 4.4 Knowledge representation and citation networks

- **Akoma Ntoso** (Palmirani & Vitali 2011; OASIS LegalDocML 2018, `[PK]`): FRBR Work/Expression/Manifestation and point-in-time constructs. Optional for statutes (D29); for judgments a Work, its reported Expression, and a PDF Manifestation identified by SHA-256, which matters because SCC and SCR paragraphing differ.
- **ELI/ECLI** (`[PK]`): templates for resolvable URIs built on the SC neutral citation.
- **Fowler et al. 2007; Fowler & Jeon 2008** (`[PK]`): hub/authority scores on citation networks; computed offline (DuckDB) as a ranking feature, never a substitute for treatment.
- **eyecite** (JOSS, `[V-link]`): tokenizer + reporters database + resolver architecture for an Indian parser covering INSC, SCC, SCR, AIR, Cri LJ, SCC OnLine and HC neutral citations (C2, C5).
- **Dhani et al. 2021** ([2107.04771](https://arxiv.org/html/2107.04771v2)): Indian legal KG with GNN similar-case recommendation; prior art only.
- **Ghosh et al. 2024** ([2403.10944](https://arxiv.org/pdf/2403.10944)): human-centred Indian legal analytics position paper.

### 4.5 Grounding and hallucination detection components

State of the art is decompose then verify: atomic claims → evidence per claim → entailment per pair → span-level support.

| Work | Design use |
|---|---|
| FActScore ([2305.14251](https://arxiv.org/abs/2305.14251)) | Atomic claim decomposition with typed claims (FACT-FROM-RECORD, CITED-PROPOSITION, QUOTE, PINPOINT, PROCEDURAL-HISTORY, ARGUMENT) |
| SAFE ([2403.18802](https://arxiv.org/abs/2403.18802)) | Agentic checking for NOT_FOUND escalation, with cost budgets |
| VeriScore ([2406.19276](https://arxiv.org/abs/2406.19276)) | ARGUMENT claims checked for premise support only |
| FactCheck-Bench ([2311.09000](https://arxiv.org/abs/2311.09000)); AIS ([2112.12870](https://arxiv.org/abs/2112.12870)) | Annotation protocols for the lawyer-labelled calibration set |
| ALCE ([2305.14627](https://arxiv.org/abs/2305.14627)) | Citation recall and precision metric definitions |
| AlignScore; SummaC; HHEM-2.1-Open; LettuceDetect/RAGTruth; Granite Guardian; Lynx | Candidate encoder scorers; LettuceDetect for unsupported-span highlighting in the review UI |

QUOTE claims never go to a model first: deterministic normalised matching (whitespace, hyphenation, curly quotes, ligatures, ellipses, "[emphasis supplied]"); fuzzy alignment only locates near-misses, which are flagged as misquotes.

### 4.6 Bitemporal data and agent memory

Snodgrass (1999) and SQL:2011 temporal features (`[PK]`): valid time, transaction time, close-and-insert writes, as-of queries on `(valid_at, known_at)`; implemented in SQLite with interval columns and triggers. A third "as-pleaded" dimension (who asserted it, in which filing) is litigation-specific. Agent memory systems (Mem0, A-MEM, MemOS, MemGPT; LongMemEval, LoCoMo; `[PK]`) optimise conversational recall with contested vendor numbers; we borrow bi-temporal edge invalidation and explicit memory tiers, and LongMemEval's temporal-reasoning and knowledge-update question types as a template for per-matter memory tests. No LLM silently rewrites or consolidates facts.

### 4.7 Structured outputs and declarative agents

XGrammar ([2411.15100](https://arxiv.org/abs/2411.15100)), JSONSchemaBench ([2501.10868](https://arxiv.org/abs/2501.10868)), "Let Me Speak Freely?" ([2408.02442](https://arxiv.org/abs/2408.02442)) (`[PK]`): constrained decoding is efficient but strict formats can degrade reasoning. Design use: free reasoning then constrained extraction into the task-contract schema; on local models, per-call grammars so `doc_id` and anchor fields are an enum of IDs actually in context. OpenHands SDK ([2511.03690](https://arxiv.org/abs/2511.03690), MLSys 2026): event-sourcing overhead negligible. Open Agent Specification ([2510.04173](https://arxiv.org/abs/2510.04173)): vocabulary reference for the playbook interpreter.

### 4.8 Limited relevance

AFlow (auto-generated workflows need a reliable reward; playbooks stay human-authored); self-evolving harnesses (Meta-Harness, HARBOR, Self-Harness, Evo-Harness: conflict with an approved, fixed system under draft Reg 19(1) and 33(3)(a)); LKIF-Core (vocabulary only); Lawma and Aalap (fine-tuned models; training out of scope); LexGLUE and LawBench (no Indian tasks); AgentCourt, SimuCourt, OASIS (outcome-centred, Chinese civil law); LICES (arXiv 2508.17499: unsupported metrics; do not cite); MOTO's Lean 4/Z3 proof checking (mathematics only).

---

## 5. Jev and Clef (W14): evidence and use (D16)

### 5.1 What the models are [V unless marked]

- **Contract (System One).** Input `state` (string or JSON) + `questions` (1–64 per request, ids ≤100 chars). Question types: `noul` (P(true)), `choice` (2–26 options locally on Ollama, up to 255 hosted; returns choice, per-option probabilities, confidence), `score` (2–10 ordered levels; probability-weighted score). Each question is evaluated independently in one non-autoregressive forward pass; adding questions barely moves latency. **No rationale output**: anything a lawyer must read comes from deterministic checks or a generative reviewer told which flag fired.
- **Clef / Clef-flash** (Cloudflare, 1 Oct 2026). Frozen Qwen-family bases (27B / 9B) + LoRA, Apache-2.0 weights on Hugging Face; Clef has vision. Workers AI context 65,536 / 24,576 tokens, state silently truncated to fit; OpenRouter's page says Workers AI truncates to ~2K tokens — **conflicting, to be tested** by planting answers at 3k, 20k and 50k tokens. Prices: Clef $0.24/M input on Workers AI ($0.192–0.24 on OpenRouter); Clef-flash $0.038/M (OpenRouter $0.018). Vendor latency median 209 / 39 ms. Calibration trained with label-smoothed CE + Brier loss; **no ECE published**. Served on OpenRouter's Decisions API (not chat completions). Self-host via vLLM, SGLang (`/v1/systemone`); Ollama `clef:27b` (18–20 GB, `POST /v1/systemone`, runs natively on Windows; ~24 GB VRAM GPU for usable speed; quantised weights need separate recalibration; no official Clef-flash tag).
- **Jev** (TypeSafe AI). Waitlist; $0.042/M input; up to 255 choices; 32k context, text only [V-2]. Retention, regions and weights not stated → **public text only** (judgments, statutes) until written retention terms exist.
- **Benchmarks** [V-2]: self-reported intent and tool-use (BANKING77, GPQA-D, When2Call, BRIGHT). **No NLI, grounding or legal benchmark from anyone.**

### 5.2 Architectural rule

Deterministic gate (veto, reason code, no model call) → Clef-flash triage on all surviving items → Clef 27B (+ Jev on public text) for the ambiguous band or high-stakes types → per-type conformal threshold → AUTO-PASS / UNRESOLVED (lawyer) / FAIL. Gates never overridden: citation parses and resolves to one judgment; quoted string present after normalisation; pinpoint paragraph exists; date parses and appears in the passage; party matches the matter registry; overruling requires the later bench to be at least as large and the overruling case to post-date; statutory section exists in the version in force on the governing date.

### 5.3 Uses in the MVP

| Use | Where | Questions (examples) | Notes |
|---|---|---|---|
| Notebook extraction checks | W3 via W14, NVS (Stage 2) | `support` (supported/partial/contradicted/absent), `date_ok`, `actor_ok`, `event_ok`, `place_ok`, **`is_allegation`** (admitted fact / allegation / finding / unclear); per-kind templates for party, date, relation (`direction_correct` catches A/B swaps) | State = item + passage (cited para ± 1); batch ≤ ~6 items / ~40 questions per call; batched vs single measured. Storing an averment ("it is submitted that…") as fact is a real defect |
| Citation L1 identity | W5 CVS (Stage 3) | `identity` choice over candidate cards + `none` | Auto-select only if top P ≥ τ and margin ≥ δ; `none` → NOT_FOUND via gates |
| Citation L2 pinpoint | CVS | `pin_support` (direct/adjacent/partial/no/contra), **`voice`** (court holding / counsel submission / lower court / dissent / quoted precedent), `quote_faithful` | `voice` catches citing a recorded submission as a holding, common in SC judgments |
| Citation L3 proposition | CVS | `holding_status` (ratio/obiter/assumed/rejected/not addressed), `scope_match` (score), `still_good` | Needs Clef 27B or retrieval-pruned excerpts; always paired with treatment |
| Precedent treatment | W11 RTS, precedent graph (Stage 4) | `treatment` (followed … overruled, per incuriam, referred to larger bench, mentioned, not about), `scope`, `who` | Public text → Jev permitted as heterogeneous second scorer; negative treatments thresholded for recall (flag at P ≥ 0.15) and always sent to a lawyer queue; `referred_larger` tracked as pending |
| Defect checking | W6 (Stage 3) | Registry/format defects mostly deterministic; Clef vision for attestation pages; substantive: `unsupported_fact`, `fact_vs_submission`, `date_inconsistent`, `relief_mismatch`, `severity` | Flags only; explanation from a generative reviewer |
| Eval scoring | W13 Verifier/Eval agent (D15) | Same question sets over (output, gold) pairs | Clef and Clef-flash share lineage: never two votes; pair with a MiniCheck-class encoder or non-Qwen judge; report κ; Brier and ECE per question type each run; pin model id from the response |

### 5.4 Calibration and routing

Lawyer-labelled set of 300–500 items per question type (SC first, held-out HC slice), 20% double-labelled for the agreement ceiling. Measure reliability diagrams, ECE and Brier per (model, question id); recalibrate (temperature, Platt or isotonic), refitting whenever `instructions` or `criteria` wording changes. Thresholds by conformal risk control (α ≈ 2% citations and negative treatment, 5% Notebook facts); calibrate the Clef-flash → Clef cascade as a cascade. Prompt-variance check: three paraphrases; a swing > 0.15 sends the item to UNRESOLVED. Routing by matter confidentiality: public-law tasks via OpenRouter Decisions API; confidential matter text via local Ollama or self-hosted Clef (D8, D16). Inference cost is negligible (e.g. treatment backfill over 50k SC judgments ≈ $38–240); the real cost is the labelled set.

---

## 6. Indian law, policy, cases and data sources

These are not research papers. They set the acceptance criteria a Court, Registry, AI Committee or Bar Council will apply to AI-assisted filings and verification tools. They converge on human verification of every citation and translation, logs of AI use, confidentiality and closed systems, disclosure, and (with the draft Regulations) a designated verification mechanism and an authority to run it. The Commons gives that mechanism a public, implementable specification.

### 6.1 Supreme Court of India — draft *Regulations for Use of Artificial Intelligence (AI) in Courts, 2026*

`POL (draft) · [V-read]` · Notice of the Member Secretary, AI Committee, **dated 03.06.2026**, comments by 20.06.2026. Every page marked "[DRAFT]"; not notified; numbering may change. Ten chapters, 57 regulations: definitions (Reg 3); general principles (4–17); permissible and prohibited uses (18–21); institutions (22–34); oversight, audits, incidents (35–45); private entities (46); data protection (47–48); training (49–51); grievances (52–53); miscellaneous (54–57). The AI-origin manifest is designed from the text of Reg 43(3)–(4) directly (D31).

| Provision | Text (abridged; quoted where load-bearing) | Design response |
|---|---|---|
| **3(1)(y)** | No GenAI content "shall be filed or produced before any Court, without mandatory disclosure of its origin and verification through a designated centralised mechanism" | Open, Court-controllable verification spec + reference SDK + local CLI; local-first (no pleading upload); hash-bound receipts |
| **3(1)(z)** hallucination | Outputs "factually incorrect, fabricated, misleading, or unsupported … including fabrication, misstatement, or erroneous representation of legal facts, evidence, case precedents, statutory provisions" | `hallucinationClass` enum: fabricated authority, misstated holding, wrong provision/version, misquoted text, unsupported proposition |
| **3(1)(q)** Court process | Includes filing, legal research, drafting, translation, record management | Every export for filing is in scope |
| **3(1)(w)** explainability | "comprehensible account of the reasoning … without requiring specialist technical knowledge" | Human-readable receipt view; every verdict links to the span and source used |
| **3(1)(x)**, **48(1)** | No transfer of sensitive judicial data to external systems without written authorisation | Local-first; BYO key per-matter policy; local model option; hash-only receipts |
| **8(2)** | "clear and documented lines of accountability" | TCR agent profiles; ledger records the approving human for each Commit |
| **8(3)** + provisos | Output "advisory"; reasonable care to verify; dispensation "for reasons to be recorded in writing"; certified administrative tools satisfy verification "on a class basis" | Dispensations as ledger events with reasons; CT suites are the evidence base for class certification [I] |
| **19(1)** | Permissible uses incl. defect identification, "legal research, precedent retrieval, citation verification and document summarisation", defect scrutiny | Citation verifier and defect checker map to named uses |
| **20(1)** (non-derogable, Reg 56) | No outcome by ADM alone; no risk scoring; no predicting future conduct; AI output not evidence without disclosure | Outcome prediction excluded (§3.13); manifest bound by hash to the filed document |
| **23(e)**, **33(3)(iii)**, **33(6)** | Harmonised national approach; common standards; suggestions from researchers and private sector | Route for submitting the Commons spec |
| **33(3)(a)**, **35(3)**, **36** | Approval after Technical and Ethical Impact Assessment (bias, error, hallucination, security, explainability, HITL); controlled environment testing | Fixed, versioned harness; architecture and evaluation dossier shaped to these heads; CT suites and golden judgments as the sandbox test harness |
| **34(4)–(5)**, **46(7)–(8)** | Expedited approval for administrative tools with no personal data, functionally similar to approved tools | A Court-side verifier over public judgments is a candidate [I] |
| **37** AI Register | Systems, purposes, approvals, audits | Machine-readable system description |
| **38(2)** | No sharing of source code, algorithms or datasets for audits outside Court premises | Court-side verifier deployable and auditable on premises: open source, reproducible builds, offline |
| **39**, **42** | Incident database; fall-back with manual continuity | Verification fails safe to UNRESOLVED; never blocks manual filing |
| **43(3)** | Declaration or certificate "at the time of submission" by a party using an AI Tool | AI-origin manifest generated per filing |
| **43(4)** | Court may require "the AI System used, the nature and extent of AI assistance provided, and the steps taken to verify the accuracy" | Manifest fields `aiSystems`, `natureAndExtent`, `verificationSteps[]` (level, source, resolution-order position, timestamp, URL, document hash, technical and semantic outcome); bound by hash to the exact version |
| **43(5)** | Disclosure of synthetic data | `syntheticData` flag |
| **43(6)** | Submitter bears full responsibility | Export gate: unresolved or failed citations block a "verified" receipt; the lawyer may still file with an explicit unresolved list |
| **44** | AI Content Verification Authority oversees "verification standards, tools and protocols" | Natural governor of a versioned Commons spec |
| **46(4)**, **46(9)** | Source and model transparency; on-premise for sensitive data; no exclusive IP over tools built on judicial data | Open source harness and open specs |
| **47**, **48(3)–(4)** | DPDP Act and IT Act; minimisation; anonymisation | Pseudonymisation before external model calls; no training |

**Inference.** The draft provides a duty (3(1)(y), 43(3)–(4)), an owner (44), a standards route (23(e), 33(3)(iii), 33(6)), a certification route (8(3), 34(4)) and an audit constraint (38(2)), but no specification. That is why the Commons is a standard first, and why the Court proposal asks for a Court-controlled minimum verification standard with a public reference SDK.

### 6.2 Other policy sources

- **Kerala High Court, Policy on AI Tools in District Judiciary** (July 2025, `POL · [V-sec]`): cl. 4.6 bars AI "to arrive at any findings, reliefs, order or judgment"; approved tools only; mandatory verification of citations and translations; cl. 4.8 detailed audit logs. Map the AI-use log clause by clause.
- **SC Centre for Research and Planning, White Paper on AI and Judiciary** (Nov 2025, `POL · [V-sec]`): judges decide; outputs cross-checked; disclosure and audit trails; no sensitive data on public platforms; bail and sentencing prediction strictly limited.
- **DPDP Rules 2025** (notified 13 Nov 2025; most duties from 12 May 2027, `[V-sec]`): residency and pseudonymisation defaults.
- **Comparative:** ABA Formal Opinion 512 (2024); EU AI Act Art. 14 (awareness of automation bias). No Bar Council of India rule on generative AI exists.

### 6.3 Cases

| Case | Holding / facts | Design response |
|---|---|---|
| ***Pune Bar Assn. v. Union of India***, 2026 SCC OnLine SC 1297 (22 May 2026) `[V]` | Upheld BSA s.63(4); hash value is "an electronic fingerprint"; Part A (hash) verifies integrity, Part B (expert) an additional layer; no algorithm specified | SHA-256 of every source; pre-filled s.63(4) certificate, Part B prepared for a s.79A-notified examiner; open offline verifier |
| ***Greenopolis Welfare Assn. v. Narender Singh*** (Delhi HC, Sep 2025) `[V]` | Cited "para 73" of a 27-paragraph *Raj Narain* judgment, a non-existent DLT case and absent quotations | Canary in CVS suite; paragraph-count gate |
| ***Heart and Soul Entertainment v. Deepak Bahry***, SLP (C) 3090/2026 (SC, Mar 2026) `[V]` | Bombay HC found an untraceable judgment; SC called the "menace … rampant in all Courts" | Existence check first; unresolved citation blocks "verified" export |
| ***Gummadi Usha Rani v. Sure Mallikarjuna Rao*** (SC, Mar 2026) `[V]` | Trial court relied on four non-existent SC judgments: "It would be a misconduct" | Filing-level verification dossier for AoRs |
| ***Nipun Saxena v. Union of India***, 2018 INSC 1192 `[V]` | Victim identity in rape/POCSO matters not to be disclosed, even indirectly | Zero-tolerance masking rule in the defect checker |
| **Charlotin AI Hallucination Cases database** `[V]` | 2,241 decisions by 29 Oct 2026 (USA 1,514; India 16); Fabricated 1,839, Misrepresented 951, False Quotes 596, Outdated 38 | Real defect patterns feed the planted-defect corpus; "Outdated" maps to treatment checks |

Procedural sources: SC A4 filing circular (12 Mar 2020) → style tokens; Order XXII SC Rules 2013 → procedure states; Registry defect practice (LiveLaw) → defect taxonomy.

### 6.4 Data sources for the ontology and the INSC resolver (D24, D29)

- **SC neutral citation notice** (6 July 2023): `YYYY INSC N`. The eSCR portal shows INSC numbers back-assigned to pre-2014 judgments (e.g. `2009INSC834`); accepted with `assignment: back_assigned`; parser accepts years from 1950.
- **sci.gov.in neutral-citation / judgements-case-no; scr.sci.gov.in**: search behind an image CAPTCHA; T1 in the resolver; lawyer solves in the built-in browser; harness saves PDF + SHA-256.
- **AWS Open Data — Indian Supreme Court Judgments** (vanga; CC BY 4.0): English judgments from 1950, partitions into 2026 (thin for 2025–2026), 69.34 GB; parquet fields `title`, `petitioner`, `respondent`, `judge`, `author_judge`, `citation`, `case_id`, `cnr`, `decision_date`, `disposal_nature`, `nc_display`, `path`. These fields are the seed of the ontology's reference layer (D29). A `coverageWindow` per snapshot; outside it → `unresolved: outside_corpus_coverage`. T2 in the resolver. HC dataset metadata extends the reference layer.
- **Indian Kanoon**: T3 via user-triggered webfetch or API with the user's key.
- **Law and Justice Wiki** (DAKSH, CC BY 4.0): non-normative concept glossary; its citations go through our resolver.
- **SUVAS** official translations exist separately for SC judgments; SC records are in English, so regional-language OCR is outside the MVP (P3, with HC and district records).

---

## 7. Court AI systems by function

Only public functional descriptions exist; internals of SUPACE and LegRAA are not public, and nothing here claims them. We use their described functions as references (D28) and measure our own implementation against NVS/CVS/RTS with the Eval agent (D15).

| Function | Court system | Public status | Our counterpart |
|---|---|---|---|
| Understand the factual matrix: file preview (PDF→text, search across files), text/voice chatbot, logic gate extracting synopsis, FAQs, evidence and case law, Notebook as integrated word processor | **SUPACE** | Experimental, "not yet deployed for regular judicial use" (PIB 11 Feb 2026) [V]; four-part workflow [V-sec] (Oxford Tech & Justice; NASSCOM) | W3 Notebook & case graph (D25): file preview, anchored chatbot, logic-gate extraction (synopsis, dates, parties, incidents, relations, evidence, FAQs, case-law mentions), Notebook editor; every item anchored and gated under NVS |
| Legal research and document analysis for judges, "strictly as research aids" | **LegRAA** (NIC AI Division) | Pilot testing (PIB 31 Jul 2026) [V]; GenAI over SC rulings from 1950 and uploaded petitions [U] | W11 Research & Argument Studio research layer (D26): SC corpus + matter documents, reference extraction, research organisation, Q&A; precedent graph with treatment under RTS |
| Defect identification in e-filing; prototypes for curing defects | SC + IIT Madras AI/ML tools | Pilot with a limited group of AoRs (PIB) [V] | W6 defect checker (Stage 3) on the filer's side; interoperates through receipts and anchors |
| Translation of judgments | **SUVAS**; PANINI | Translations on e-SCR [V] | Not replicated; translations are inputs |
| Speech recognition | SHRUTI (Digital Courts 2.1) | [V] | Not in MVP |
| Case management | Digital Courts 2.1; eCourts Phase III (₹53.57 crore for future technologies) | [V] | eCourts / sci.gov.in connectors via BrowserCapture are P3 |

Both SUPACE and LegRAA are pilots; nothing here claims Court endorsement. Our receipts, anchors and Reg 43(4) manifest are designed so court-side systems can consume them.

### 7.1 SUPACE: augmented intelligence, organising not evaluating

`POL · [V-sec]` (secondary description; internals not public). SUPACE (Supreme Court Portal for Assistance in Court's Efficiency) was launched on 6 April 2021 by CJI S.A. Bobde. It is described as **augmented intelligence, not automation or adjudication**: it automates the administrative and data-processing side of judicial research without intruding on legal reasoning or decision-making. A hybrid ML + NLP pipeline uses OCR to convert bulky PDFs, scanned pleadings, annexures and prior orders to text. The four-tier workflow is: file preview and indexing; a conversational chatbot; a **logic gate** that classifies extracted material into synopsis, chronology, evidence and cited case law; and an integrated notebook that aggregates extracted information and supports note preparation with voice-to-text. **The logic gate does not evaluate merits or suggest outcomes; it organises material for quicker access to the relevant portions of the record.**

**Design principle adopted [R].** W3 and W11 organise, retrieve, anchor and verify; they never evaluate merits or suggest outcomes. Concretely: W3 logic-gate outputs are typed, anchored items (synopsis, dates, parties, incidents, relations, evidence, FAQs, case-law mentions) whose only judgments are verifiability checks under NVS; W11 surfaces authorities, treatment and arguments with evidence, and the Case Conference and W12 MOTO produce candidate issues, objections and weak points for the lawyer to accept or reject, never a recommended result. This is the same boundary as draft Reg 8(3) (output advisory) and Reg 20(1) (no outcome by ADM, no risk scoring), and as the outcome-prediction exclusion in §3.13.

### 7.2 Prior-art analogs: no single system unifies the components

No single end-to-end open system combines a local desktop workspace, deterministic paragraph-level citation verification, a hash-chained ledger with signed receipts and a court defect checker for Indian litigation. Each component has an analog (repositories detailed in C2):

| Component | Analog | What it shows | Module |
|---|---|---|---|
| Citation parsing | eyecite (Free Law Project) | Tokenizer + reporters database + resolver with string coordinates | W5 |
| Local/BYOK citation checking | CiteSight, CaseCite | Parse citations and check authority and quotes against primary databases (CourtListener) | W5 |
| Offline SC corpus | vanga / AWS Open Data | Partitioned parquet keyed by neutral citation, SCR locator and dates | W5, ontology |
| Reversible agent edits | Docxodus | Native tracked changes with a round-trip contract: accept(compare(L, R)) ≡ R, reject ≡ L | W8 |
| Geometric anchors on mixed scanned/born-digital records | OpenContracts (PAWLS token boxes) | Annotations anchored to PDF token bounding boxes | W2 |
| Indian structure and entities | OpenNyAI legal_NER, rhetorical-role baseline | Argument spans cannot be passed off as findings (Ratio/Analysis rule, §4.3) | W5, W3 |
| Indian retrieval benchmarks | IIT Kharagpur AILA (FIRE 2019) | Fact description → relevant statutes and precedents | W11, W13 |
| Transparency logs and receipts | C2SP/Tessera; in-toto/DSSE | Merkle inclusion/consistency proofs (P1); signed attestation envelopes bound to a file hash | W9 |
| Court document intelligence and research | SUPACE; LegRAA | Four-tier factual-matrix workflow; research aid over SC judgments | W3; W11 |
| Commercial authority checking | Vincent AI (vLex), Lexis+ AI, CoCounsel | Automated authority checks and headnotes, but closed SaaS, whole-case retrieval rather than deterministic paragraph pinpoints, and no signed audit manifests | Contrast for W5, W9 |

**Synthesis [I].** The novelty is the assembly: eyecite-style parsing, Docxodus-style reversible redlines, OpenNyAI-style rhetorical segmentation, PAWLS-style geometric anchors and in-toto-style signed receipts, combined in one local-first Windows workspace tailored to Supreme Court evidentiary and procedural requirements, and measured against open standards (NVS/CVS/RTS) by an independent Eval agent.

---

## 8. Contradictions and reconciliations

| # | Question | Side A | Side B | Reconciliation | Consequence |
|---|---|---|---|---|---|
| X1 | Does AI improve legal work quality? | GPT-4 RCTs: speed, small quality gains, harm to top performers | Reasoning model + RAG: significant gains | Task phase and model generation matter; AI harms revision of strong drafts | Gains per task type; revision as tracked changes |
| X2 | Do multiple agents help? | Debate gains; asymmetric debate; PatchBoard | Equal-compute losses; conformity flips; MAST | Gains come from compute, decomposable tasks or typed shared state | One agent + verifier; fan-out with typed returns; Case Conference walled and human-chaired |
| X3 | Long context or RAG? | Self-Route | NoLiMa, BABILong, Context Rot | Legal questions are paraphrastic | Retrieval first, widen retrieval |
| X4 | Do explanations help? | Raise blind acceptance | Reduce over-reliance | Help when they make checking cheaper | Span-linked evidence |
| X5 | Are models calibrated? | Kadavath (MC self-evaluation) | Dahl (legal overconfidence) | Domain- and format-specific | Only locally calibrated scores shown; Jev/Clef recalibrated per question type |
| X6 | Domain-expert chunk enrichment? | Intuition | Generic summaries won (Reuter) | Mechanism unknown | Measure DRM first |
| X7 | Indian RR/NER accuracy | IL-TUR macro/strict | SemEval micro | Different averaging | Report macro and strict |
| X8 | Is a hash chain tamper-evident? | Chain | O(n) proofs, no outside verifiability | A chain is a WAL | Local chain + signed checkpoints + RFC 3161; witnessing in P1 |
| X9 | Are LLM-built legal graphs useful? | Goel; LaMAS4PD | GraphRAG-Bench; Goel errors; TEXT2KG recall | Graphs help on typed relations from metadata | Ontology from SC/HC metadata; extraction only for propositions and treatment |
| X10 | LLM or deterministic validator? | LaMAS4PD synthesis agent | Ontology-to-tools, PatchBoard, Contracts | Structure is decidable; support is semantic | Kernel for structure; models score level 3 and treatment |
| X11 | Abstain or fall back? | UNRESOLVED | Deterministic composer | Composer renders validated inputs only | Fallback for presentation only |
| X12 | Is a reviewer agent enough? | Centralised verifier | Advisory reviewer barely helps | Verifier must hold the gate | Proof-or-Stop |
| X13 | Agent-owned notes vs external record | Agent notes and compaction | Code owns the record | Keep techniques, change ownership | Scratch and compaction never promoted |
| X14 | Event-sourcing cost | Negligible writes | Replay grows with log | Different quantities | Signed snapshots; replay from last |
| X15 | Do statutes make prediction work? | +Statutes 67% | Facts-only 51% | Post-decision text | Prediction excluded |
| X16 | Better model = better result? | Leaderboards | 40× token spread; pairing-dependent | Harness is under test | Model × harness × config hash |
| X17 | More capable = safer? | Intuition | MSB | Capability raises injected-instruction following | Security gates independent of model |
| X18 | Are decision models calibrated? | Vendor training with Brier loss; "calibrated probabilities" | No ECE, no legal or NLI benchmark | Claims are untested on legal text | Recalibrate locally; deterministic veto; never sole gate |

---

## 9. Open research problems

Each is also an evidence asset produced by the Verifier/Eval agent and the golden matters.

1. **Indian pinpoint citation-support benchmark** at INSC/SCC paragraph level, planted-defect method, seeded with *Greenopolis*, *Heart and Soul*, *Gummadi Usha Rani* and Charlotin India entries; per level and per `hallucinationClass`. (Stage 3, CT-04)
2. **Golden judgments set**: ≥50 INSC-keyed SC judgments, two annotators + adjudicator; per-type P/R for paragraph boundaries, cited-authority extraction and treatment. (Stages 1–4)
3. **Calibration of Jev/Clef on legal entailment, voice and treatment**; dual-verifier error correlation; batched vs single-item accuracy; local quantised drift; true state length honoured on each backend.
4. **Indian temporal statutory QA** (IPC/BNS, CrPC/BNSS, IEA/BSA, state amendments).
5. **Point-in-time case-law validity**: overruling, per incuriam, pending larger-bench references; no Indian citator dataset exists.
6. **Automation bias among practising Indian advocates**: RCT with planted errors.
7. **End-to-end provenance evaluation** (claim → span → source version → receipt).
8. **Compiled tools vs free-form writes** on matter-graph population (own ablation).
9. **Cascade invalidation correctness and lawyer burden** at matter scale.
10. **Execution-alignment rate** in legal drafting.
11. **Legal multi-agent failure taxonomy** (MAST on litigation traces, incl. Case Conference and MOTO).
12. **Structure extraction from pleadings** (SLPs, counter-affidavits); Indian IE so far uses judgments only.
13. **Re-scoring IL-TUR tasks** with current models on recent SC judgments.
14. **Uncertainty communication to lawyers.**
15. **Minimum content of the "designated centralised mechanism"** (Reg 3(1)(y)): mandatory levels, authoritative sources, proof of local verification without uploading pleadings.
16. **MCP security on legal tool ecosystems**: MSB against our gateway and browser tools.
17. **MOTO evaluation**: issue recall and ground diversity against what benches actually raised, with sycophancy rate.

---

## 10. Verification backlog before external publication

- Track whether and when the draft Regulations are notified and whether numbering changes.
- Full texts not yet read: Proof-or-Stop, ontology-to-tools, PatchBoard, MemTX, Cordon, Scaffold Effect, Harness-Bench, OntoExtend, MSB (and run its code).
- Numbers marked [PK]: RULER, BABILong, LongBench v2, AFlow, Who&When, SemEval-2023, Choi et al.; Reuter effect sizes; Prior et al. results; LegalCiteBench.
- Primary texts of the Kerala HC policy and SC CRP White Paper on official sites.
- Data: sample pre-2014 INSC numbers against SC lists; open a vanga parquet partition and confirm field semantics and cadence.
- Court systems: LegRAA corpus statement (Lok Sabha 10-12-2025); SUVAS counts.
- Jev/Clef items in §5 and §9 item 3.
