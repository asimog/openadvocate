# Vakilbench

An open-source workspace where an Indian advocate prepares a Supreme Court SLP with verifiable document intelligence, complete citation verification, AI-assisted research under human control, and the petition run as a procedure, not generated as a document.

Three products on one open standard:

1. **Vakilbench workspace.** The open-source GUI for advocates.
2. **ULOS, the open standard, and a simulated Supreme Court** that demonstrates it with real verification code.
3. **Commercial service.** Deferred.

## Docs

- [Product](docs/product.md). The three products, what the advocate does, the rules the product keeps.
- [Architecture](docs/architecture.md). Four data layers with enforced owners, each module's checks.
- [SLP state machine](docs/slp.md). States, guards and the Supreme Court defect rules.
- [Plan](docs/plan.md). Phases, each ending in a GUI run of the golden matter.
- [Research](docs/research/). The background studies.

## Layout

```
standard/            ULOS: JSON Schema (source of truth), ontology, codegen
packages/core        Generated types, validation, ledger with write ownership, receipts, citation grammar, Jev/Clef port
packages/notebook    Record layer (SUPACE model): two-engine text, deterministic extraction, five checks
packages/citations   Verification layer: identity, pinpoint, support, standing over source tiers
packages/studio      Argument layer (LegRAA model): research, claims, MOTO, Case Conference
packages/pleading    Procedure layer: SLP state machine, Supreme Court defect rules
sim/supreme-court    Simulated court: judgments, source tiers, case records, registry, second reader, evaluation agent, GM-01
apps/workspace       The GUI (React), with Playwright tests
apps/cli             ulos: receipt verification backend
```

## Develop

Needs Node 24 and pnpm.

```bash
pnpm install
```

```bash
pnpm dev
```

```bash
pnpm check
```

```bash
pnpm e2e
```

After editing `standard/schemas/ulos.schema.json`, regenerate the types:

```bash
pnpm codegen
```
