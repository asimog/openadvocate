# Advocate flow

Working note. How a matter enters the workspace, becomes a Notebook, and is turned into a draft SLP.

## 1. Case in

A case comes in for an SLP. The advocate opens it and enters the details.

Optionally, they upload documents they already have.

## 2. Pull the High Court record

A scraper goes to the High Court website.

- If the advocate is not logged in: open a browser page. The advocate logs in.
- When a captcha appears: open a page in the browser. The advocate enters it. Then we download.
- Download every artifact present on that High Court case.

The advocate solves login and captcha. The software does not bypass them.

## 3. Analyze as each file lands

Do not wait for the full download. As soon as an artifact is saved, schedule a job to analyze it.

The job:

1. Detect the type: PDF, JPG, PNG, TXT, CSV, and so on.
2. Categorize it and make a record.
3. Transcribe it. Scans, images, and image-PDFs go through OCR engines. Born-digital text (TXT, CSV, a PDF with a real text layer) is extracted without OCR.

When transcription is done, each attachment has:

- the file itself
- its name
- annexure details from the previous case files
- the transcription

## 4. Notebook

The Notebook fills as each file finishes analysis, not after the whole download. It is the combined record of everything so far, with room for later work (citations, claims, the SLP procedure).

Each attachment (file + name + annexure details + transcription) is linked to a Notebook object.

After analysis is done, this Notebook is the working copy. All later work uses it.

## 5. Storage

- Ledger: append-only SQLite per matter. The truth and the audit log (see `docs/working-architecture.md` §10).
- SQLite for operational records: matter, jobs, file hashes vs disk. Jobs: **apalis** + SQLite (§9).
- Files on disk, content-addressed (hash).
- Notebook is a **Ladybug** graph (`lbug`), built from the ledger. One graph per matter.

## 6. Studio

Once the Notebook is ready, Studio starts. Separate system, same Notebook.

Lawyer brings API keys. We ship default prompts; the lawyer can override them, and can add a custom step to their flow.

Steps (defaults we ship, all overridable):

- research
- memo
- questions of law
- drafting
- adversarial review of arguments

The lawyer instructs; Studio produces artifacts. Those go back into the Notebook. Studio never writes facts.

## 7. Draft SLP

When Studio work is done, prepare a draft SLP. Structure:

- Summary (synopsis)
- Factual Matrix
- Question of Law
- Arguments
- Annexure

**Factual Matrix is not an LLM job.** It is the chronology: what happened when, client and court specific, from what the lawyer entered plus what we downloaded and transcribed. It has its own schema. For now include every dated event. The lawyer can exclude a date, or a type of date.

**Synopsis** is a view over that chronology (and the rest of the record), also schema-shaped. An LLM may later polish prose, but only from matrix rows, each sentence citing an event id. V1 writes it from the schema, not from a model.

Question of Law, Arguments, memos, research: Studio / LLM, grounded in Notebook ids.

Each part cites material in the Notebook that came from the previous case. Every citation must be correct and verifiable.

Schema and structure of everything is the same, and formatted to our schema and ontology.

## 8. Handoff

Give the output to the lawyer.
