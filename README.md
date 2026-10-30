# Vakilbench

A desktop workspace where an Indian advocate prepares a Supreme Court filing with AI help, and every fact and citation in it comes with proof a court can check offline.

**AI proposes. Checks and the advocate decide.**

## Docs

- [Product](docs/product.md). What it does, for whom, and what it will not do.
- [Architecture](docs/architecture.md). Six data shapes, one writer, status derived from the ledger.
- [Plan](docs/plan.md). Phases 0 to 6, each with a check that proves it.
- [Research](docs/research/). The full background studies, kept for reference.

## Layout

```
packages/core   Data shapes, hashing, ledger, gates, kernel, status view, receipts
apps/cli        ilac verify: checks a receipt offline
docs            Product, architecture, plan, research
```

## Develop

Needs Node 24 and pnpm.

```bash
pnpm install
```

```bash
pnpm check
```

```bash
pnpm ilac verify receipt.json public-key.pem filing.pdf
```
