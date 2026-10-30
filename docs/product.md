# Product

Vakilbench is a desktop workspace where an Indian advocate prepares a Supreme Court filing with AI help, and every fact and citation in it comes with proof a court can check.

## The problem

AI drafts look right and are often wrong: invented cases, wrong paragraph pinpoints, facts the record does not say. The Supreme Court's draft AI Regulations (June 2026) make the filer responsible for every such error and require them to disclose AI use and how they verified it. Nothing today gives an advocate that proof.

## Who uses it

- **The advocate** prepares a matter and files with confidence.
- **The court or registry** checks a filing's receipt offline, without seeing any draft or client text.

## What the advocate does

1. Creates a matter and drops in the record (PDFs, scans, DOCX).
2. Lets AI pull out facts, dates, parties and events. Each one points to the exact line it came from.
3. Researches authorities. Each citation is checked: does the case exist, is the paragraph right, does it say what we claim.
4. Weighs AI-suggested arguments and keeps the ones they agree with.
5. Drafts with AI. Every AI edit is a tracked change they accept or reject.
6. Exports the filing with a signed receipt and an AI-use declaration.

## The one rule

**AI proposes. Checks and the advocate decide.**

- Nothing is "verified" until it passes fixed checks against its source and the advocate accepts it.
- If anything changes, its verification resets.
- If something is rejected, everything that depended on it is blocked.
- The export refuses anything not verified.

## What ships first (MVP)

- Windows app, works offline, no account. The advocate brings their own model key or runs a local model.
- Supreme Court matters, English documents.
- Facts from the record, Supreme Court citations, precedent treatment, suggested arguments, tracked-change drafting, signed receipts.
- An open `ilac` command-line tool anyone can use to verify a receipt.

## What we will not do

- Predict outcomes, win chances or how a judge will rule.
- Bypass court website CAPTCHAs. The advocate solves them in the built-in browser.
- Upload client documents anywhere the advocate has not chosen.

## Later

1. Website and shared matters.
2. macOS and Linux.
3. High Courts, eCourts connectors, regional languages.
4. Paid hosting and collaboration on the same open core.
