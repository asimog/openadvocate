# Product

We are building three products on one open standard.

| # | Product | What it is | Status |
|---|---|---|---|
| 1 | **Vakilbench workspace** | An open-source desktop app for advocates: document intelligence, citation verification, research, a case graph that remembers, and an SLP that moves through procedure step by step | Building |
| 2 | **The open standard and a simulated Supreme Court** | ILO: JSON Schemas, an ontology and verification rules. Plus a simulated Supreme Court that shows the standard working: it serves judgments and case records, checks filings for defects, verifies receipts and grades the workspace with an evaluation agent | Building |
| 3 | **Commercial service** | Hosting, chamber collaboration and custom models on the same harness and standard | Deferred |

## The problem

AI drafts look right and are often wrong: invented cases, wrong paragraph pinpoints, facts the record does not say. The Supreme Court's draft AI Regulations (June 2026) make the filer responsible for every such error and require them to disclose AI use and how they verified it. A duty to verify is not a specification. Product 2 is the specification. Product 1 is the first tool built to it.

## What the advocate does

1. Opens a matter: an SLP against a High Court order.
2. Adds the record: impugned order, FIR, custody certificate, annexures. The **Notebook** reads every line with two OCR engines and extracts dates, parties, statutes, case numbers and citations. No generative AI touches this. Each datum is checked against its source line and against the court's own case record.
3. Opens the **Citation verifier**. Every citation already in the documents is checked at four levels: does the judgment exist, is the paragraph right and does it contain the quote, does that paragraph actually hold what is claimed, and is the judgment still good law.
4. Researches in the **Research & Argument Studio**. The Studio and the **MOTO engine** propose new questions of law, grounds and counter-arguments, each grounded only in verified data.
5. Chairs a **Case Conference**: accepts, rejects or defers each proposal with a reason. Nothing generated enters the pleading without this.
6. Moves the **SLP** through its procedural states. Each step opens only when the Supreme Court's rules for it are met. The defect checker applies the filing rules before anything is filed.
7. Files to the simulated Supreme Court with a signed receipt and an AI-use declaration.

## The rules the product keeps

1. **The record is the store of truth.** Only the Notebook writes it, and only by deterministic rules. Nothing generated can become a fact.
2. **Verification never invents.** The citation verifier checks citations that exist. It never adds one.
3. **Only the Studio and MOTO generate,** and what they generate is a claim until the advocate accepts it in a Case Conference.
4. **Every claim is grounded** in verified data. If the data under it fails, the claim is blocked.
5. **Two readings for everything that matters.** Two OCR engines per line. Jev/Clef decision models as a second, independent check on extracts and citations. Disagreement goes to the advocate.
6. **The pleading is a procedure, not a document.** It cannot reach "filed" until every state's rules pass.
7. **No CAPTCHA bypass. No upload of client documents** anywhere the advocate has not chosen.

## The demonstration (product 2)

The simulated Supreme Court plays the court's side of the standard:

- It serves judgments at three source tiers and a case-record repository.
- It runs the real verification code on its data, so a citation shown as verified is verified, not staged.
- Its registry checks a filed SLP against the same defect rules and verifies the receipt offline.
- Its evaluation agent holds the answer key for each test matter and grades the workspace's Notebook, citation and defect results.

## MVP

Windows desktop app. Supreme Court SLPs (criminal first). English documents. Offline-first, no account, bring your own model key or a local model. The GUI is the product and is tested from the first commit. The `ilac` CLI is a backend tool for verifying receipts.

## Not doing

- Predicting outcomes, win chances or how a judge will rule.
- Generating facts.
- High Courts and regional languages (after MVP).
