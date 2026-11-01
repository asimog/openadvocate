# C6 — Indian judicial data, APIs and interoperability: phase 1 findings

Retrieved 2026-11-01. Phase 1 covers public documents only. CAPTCHA-gated portals (ecourts.gov.in services, the SCI case status page, judgments.ecourts.gov.in) are **deferred** to phase 2, which needs the user present.

Raw documents: `sources/raw/`. Extracted text: `sources/text/`. Every file with its URL and retrieval date: `sources/manifest.tsv`.

Confidence labels: **VO** verified official · **OO** observed official · **SE** secondary · **INF** inferred · **UNK** unknown.

## 1. Key findings

| # | Finding | Conf. | Source (sources/raw/) |
|---|---|---|---|
| F1 | The "eCourts Open API" exists. It serves **NJDG data** to **government institutional litigants**: Central and State departments, semi-government bodies, local bodies and PSUs. Its purpose is litigation tracking. | VO | `njdg-open-api-circular-2023.pdf` (DoJ D.O. 12012/100/2020-eCourts, 31 Aug 2020; DoLA D.O. A-60011/IT/5/2018, 2 Nov 2020) |
| F2 | Access steps: register on NAPIX (bharatapi.gov.in), complete a paper application with the officer's seal, get the High Court CPC to countersign, email it to ecommittee@aij.gov.in, then e-Committee issues a **Department ID and Authentication Key**. | VO | same, "Step 2" |
| F3 | No public endpoint catalogue, OpenAPI file, data dictionary, rate limits or sandbox was found. The application form has no category for private or non-government applicants. | UNK | absence across all sources |
| F4 | The CNR is a unique 16-character "Case Number Record". In CIS 2.0 it was described as state code + district code + establishment code + filing number + year. | VO (length, uniqueness) / OO-ish (layout, a single HC training note) | `cis-national-core-2021.pdf` l.124; `calcutta-cis-case-number-record.pdf` |
| F5 | The CNR, filing number and registration number **stay the same** on a transfer within an establishment. They **change** on a transfer to another establishment. A matter can therefore have more than one CNR over its life. | VO (judicial academy training deck) | `sikkim-cis.pdf` |
| F6 | CIS masters are layered: National, State, Local and Periphery, linked through "Unification → Mapping (National Codes)". Acts carry National Codes, and ICJS integration requires them. | VO | `sikkim-cis.pdf` l.130–142; `cis-icjs-2023.pdf` |
| F7 | CIS National Core 3.2 runs in District Courts and National Core 1.0 in High Courts (2021). CIS 4.0 is referenced in a J&K HC circular dated 14 Jul 2026. | VO | `cis-national-core-2021.pdf`; `jkhc-cir-20-2026.pdf` |
| F8 | CIS stack: PHP + PostgreSQL + JSON + Slony replication. Process (summons/notice) masters are JSON files (`civil_process.json`, `criminal_process.json`). | VO | `sikkim-cis.pdf` l.15–22, 307–309 |
| F9 | NJDG-SC dimensions: pendency stages are *Admission Complete, Regular and Ready, Admission Incomplete, Regular Not Ready*. Nature of disposal is *Dismissed, Disposed of, Allowed, Granted, Others, Conditional Order*. Reports also cover age-wise, case-type-wise, orders not uploaded and undated cases. | VO | `njdg-sc-manual-2026.pdf` §7.3, §8.3 |
| F10 | ICJS provides APIs that CIS uses to consume FIR and charge-sheet data from CCTNS. CPCs request the integration from e-Committee. CIS 3.1 was "rolled out mostly for ICJS, eFiling, sharing APIs". | VO | `cis-icjs-2023.pdf`; `thc-icjs-manual.pdf`; `pib-icjs-2022.pdf` |
| F11 | e-Courts APIs are already shared with UMANG and CSCs. These are government-to-government channels. | VO | `cis-national-core-2021.pdf` l.307–318 |
| F12 | Phase III Vision commits to open APIs, data standards, specifications and certifications, and to case law "with appropriate standards". This is a policy opening for a Setu standards contribution. It is not a spec. | VO | `ecourts-phase3-vision-final.pdf` l.343–423, 1279–1290 |
| F13 | SUPACE and LegRAA are pilots. Government stated in Parliament (Dec 2025) that there is no formal AI policy. No schema or interface has been published for either. Now confirmed officially, see F22. | VO via F22 (the Dec 2025 Lok Sabha PDF itself is still unreachable) | see F22 |
| F14 | LIMBS (DoLA) is the intended consumer of the Open API for Union litigation. No LIMBS API doc was found. | VO (relationship) / UNK (interface) | `njdg-open-api-circular-2023.pdf` |
| F15 | MeitY Open API Policy (2015): APIs must be open and machine-readable, backward compatible with ≥2 prior versions, and use NDSAP data classification. API Setu is the implementation platform. | VO | `apisetu-api-policy.html`; `apisetu-sop-v0.pdf` |
| F16 | `ecourtsindia.com/api` is a **third-party** API, not an official one. | SE/unofficial | `ecourtsindia-api-docs-UNOFFICIAL.html` |
| F17 | The **LIMBS API is CNR-based**: a request to the NJDG server with a valid CNR returns the updated case status. A broader API was then being shared that accepts Case Number, Filing Number, Name of Party and Name of Advocate. Separate APIs exist for UMANG, CSCs, ICJS and ePay vendors. | VO | `ecourts-phase2-objectives-accomplishment-report.pdf` p.65 |
| F18 | "eCourts APIs are prepared, its **documentation is complete**", pending NIC gateway clearance, and "presently ... for Central and State Government only." A spec therefore **exists but is not published**, so the e-Committee request should ask for it by name. | VO | same, p.66 |
| F19 | The Phase III DPR repeats that the API is hosted on Bharat API, is open to Central and State departments, and is used by "local bodies, insurance companies and banks". It plans to extend it to all government departments. It does not mention private or Bar access. | VO | `ecourts-phase3-dpr.pdf` §B Open API, p.54 |
| F20 | Phase III commits to **neutral citations for all judgments** of the SC, HCs, District and Taluka courts. It also commits to **JTDRs** (Judicial Trustworthy Digital Repositories) as an authoritative case registry, with "unified standards for identifiers of a case, ensuring CNR is linked in every case", and APIs from JTDRs to "litigation management" systems. This is the documented slot where Setu fits. | VO | `ecourts-phase3-dpr.pdf` p.107 |
| F21 | e-Filing 3.0 (filing.ecourts.gov.in; efiling.ecourts.gov.in is the legacy domain): the Bar Registration Number is checked against Bar Council data; vakalat is assign partner → offer → accept → print; there are pleadings, oath recording, e-sign via C-DAC eSign (Aadhaar virtual ID), IA filing (advocate only), and court **Objections** on cases, pleadings and IAs; fees through ePay GRN; identifiers are the **e-Filing Number** and later the Case Number. No defect code list is published in the manual. | VO (HC-hosted official manual) | `efiling3-manual-jharkhand-hc.pdf` §3, §4.2.5, §6.3–6.6; `efiling3-sop-telangana-hc.pdf`; `efiling-manual-ecommittee-2023.pdf` |
| F22 | PIB (Feb 2026): **LegRAA** = "Legal Research Analysis Assistant", which analyses documents, extracts legal references and organises research. **SUPACE** = "Supreme Court Portal for Assistance in Court Efficiency", for precedents and the factual matrix, "experimental ... not yet deployed for regular judicial use". Both are "strictly research aids", with no role in outcomes or drafting. ASR-SHRUTI (voice-to-text) and PANINI (translation) support dictation in Digital Courts 2.1. No interfaces are published. | VO | `pib-ai-judiciary-2026-02.pdf` p.3; `doj-lok-sabha-replies-budget-2026.pdf` |
| F23 | DPDP Rules 2025 were notified in the Gazette on 13 Nov 2025 (G.S.R. 846(E)), with phased commencement. A corrigendum, G.S.R. 892(E), was issued on 10 Dec 2025 and is not yet saved. The DPDP Act 2023 Gazette is saved too. | VO | `dpdp-rules-2025-gazette-267650.pdf`; `dpdp-act-2023.pdf` |
| F24 | MDDS: an overview report and the list of notified standards are saved. The MDDS Demographic v1.1 PDF returned an empty file. No court or justice domain MDDS was found in the notified list. | VO / UNK (justice domain) | `mdds-overview-part1.pdf`; `egovstandards-notified.html`; `apisetu-mdds-intro.html` |
| F25 | ECLI: EUR-Lex blocks automated retrieval. An ACA-Europe 2011 seminar deck explaining ECLI is saved instead. Format: `ECLI:{country}:{court}:{year}:{id}`, from Council Conclusions 2011/C 127/01, revised as 2019/C 360/01. | SE (deck) / VO pending | `ecli-aca-europe-warsaw-2011.pdf` |

## 1b. Phase 2 — portal observations (SCI and Delhi HC only, 2026-11-01)

The user solved the CAPTCHAs and logged in. I only read pages and changed dropdowns; nothing was submitted. Captures are in `sources/portal/` (JSON, plus screenshots of pages without personal data; party and advocate names are redacted). The code lists are in `sources/taxonomy/*.csv`, and `taxonomy/INDEX.csv` gives each list's source element, URL and timestamp. Every row below is **OO** (observed official).

### Identifiers

| Concept | SCI (sci.gov.in) | Delhi HC (hcservices.ecourts.gov.in, CIS) | District, Delhi (e-Filing 3.0) |
|---|---|---|---|
| CNR | `SCIN010692861986` = `SCIN01` + 6-digit diary no. (069286) + year | `DLHC01-014074-2018` = `DLHC01` + filing no. + year (shown hyphenated) | establishment code `DLCT01` etc. is the CNR prefix |
| Primary filing id | **Diary Number** `69286/1986` | **Filing Number** `W.P.(C) /14074/2018` | e-Filing Number (manual F21) |
| Registered id | **Case Number** `SLP(C) No. 001359 - 001378 / 1986`. It can be a **range** (batch registration). | **Registration Number** `W.P.(C) /991/2018` | — |
| Case-type code | numeric, 39 types (`1` = SLP(C), `3` = CIVIL APPEAL …) → `sci_case_type.csv` | numeric CIS code, 155 types (`83` = ARB.A., `8` = BAIL APPLN. …) → `dhc_cis_case_type.csv` | `local~national`, e.g. `45~5012` → `efiling_case_type_SAMPLE.csv` |
| Same court, other system | — | delhihighcourt.nic.in uses the **abbreviation as the value** (150 types) → `dhc_site_case_type.csv` | — |
| Court / bench | — | `sess_state_code` (25 HCs, e.g. Delhi) and `court_complex_code` `1` = Principal Bench at Delhi | `selTagState` 7 = Delhi, district `8` = Central, establishment `DLCT01~1` |

**Significance.** The CIS layering (local code → National Code; F6) shows up in the e-Filing option values: `73~5012` and `45~5012` both map to national `5012`, and criminal codes are `6xxx`. **CIS National Codes are therefore the right join key** across establishments. They are not published as a list, so the request to e-Committee should be for that master.

### Case detail fields (labels exactly as displayed)

- **SCI:** Diary Number (with "Filed on" and "[SECTION: …]"), Case Number ("Registered on"), CNR Number, Present/Last Listed On, Status/Stage (e.g. `DISPOSED (Motion Hearing [FRESH (FOR ADMISSION) - CIVIL CASES])` with Disposal Date), **Disp.Type** (e.g. `Dismissed`, which matches the NJDG-SC nature-of-disposal list, F9), Category, Petitioner(s), Respondent(s), Petitioner Advocate(s), Respondent Advocate(s). Sub-tabs: Argument Transcripts, Indexing, Earlier Court Details, Tagged Matters, Listing Dates, Interlocutory Application Documents (columns: Serial Number, Reg. No./I.A. No., Particular, Remark, Filed By, Filing Date, Status, Entered On), Court Fees, Notices, Defects, Judgement/Orders, Mention Memo, Drop Note, Office Report, Similarities, Caveat. The 1986 case had empty tabs, so their column sets are still unobserved, except for the IA tab.
- **Placeholder dates.** The 1986 SCI record shows `Filed on 01-01-1900`. Legacy records use 1900-01-01 as a "no date" value, so an importer must treat it as **unknown**, not as a real date.
- **Delhi HC (CIS):** Filing Number, Filing Date, Registration Number, Registration Date, CNR Number; First Hearing Date, Decision Date, **Case Status** (`Case disposed`), **Nature of Disposal** (`--` here), **Coram**, **Judicial Branch** (`APPELLATE SIDE`), Not Before Me; Petitioner and Advocate; Respondent and Advocate; **Category** with a numeric code (`Misuser/theft of electricity ( 400003 )`); IA Details (IA Number, e.g. `CM APPL./4171/2018`, Classification, Party, Date of Filing, Next Date, IA Status); Case History (Cause List Type, Judge, Business on Date, Hearing Date, **Purpose of Hearing**, e.g. `FRESH MATTERS & APPLICATIONS`); Orders (Order Number, Order on, Judge, Order Date, View). Footer: "Version: 3.0", content owned by e-Committee, hosted by NIC.
- **HC search modes:** Party Name, Case Number, Filing Number, Advocate Name, FIR Number (police station master, 348 Delhi stations), Act, Case Type. The page itself says "Cases can be searched on the basis of" these.
- **Defect:** the Act dropdown (`actcode`) returned a PHP `object(PDO)` dump and numbers in place of act names. The HC act master **could not be observed** (`dhc_cis_act_RAW_BROKEN.csv`).

### e-Filing 3.0 masters (Delhi district, logged in)

Saved as CSVs in `taxonomy/`:
- Relief Sought (case group): civil 15, criminal 10
- Party organisation type (`1001` Central Government Department, `1002` Central PSU …, 25 types)
- Insurers (35)
- Salutation
- Relation flag (Self, Spouse, Father …, 19)
- Caste/religion category
- States (37, census-style codes, e.g. 28 = Andhra Pradesh)
- Police Challan / Private Complaint
- FIR type
- Investigation agency (NIA-1, CBI-2, SFIO-3 …, 20)
- Session / Regular / Criminal Process
- Employment type

Several labels carry the code as a suffix ("Hindu/SC-2", "NIA-1"), which is CIS's display convention.

## 1c. Scope decision (user, 2026-11-01)

The Setu standard focuses on **the CNR method and the Supreme Court taxonomy**. High Court and District Court data is **out of scope for the standard**. In the Notebook it appears only as *sources*: the impugned HC order and the trial-court order, fetched as PDFs from the court's own site and checked there. The HC/DC lists in `taxonomy/` stay as reference material, not as standard enums.

## 1d. Supreme Court taxonomy (what the standard should adopt)

All lists below are **OO/VO**, kept verbatim in `taxonomy/`. Retrieval details are in `INDEX.csv`.

| Dimension | Official source | Values | File |
|---|---|---|---|
| **Case type** | sci.gov.in `case_type` select. The same 39 codes are used by the case status, judgments and daily-order searches. | `1` SLP(C), `2` SLP(Crl), `3` Civil Appeal, `4` Criminal Appeal, `5` WP(C) … | `sci_case_type.csv` |
| **Subject category** | **Notice F.No.11/Judl./2025, 17 Apr 2025**, in force from **21 Apr 2025**. Annexure A gives the new categories, Annexure B maps old to new, Annexure C is the list under Part IV of the Third Schedule, SC Rules 2013. The notice says to use it "in the e-filing module and listing proforma". | 46 groups (`01`–`48`), 182 codes, in the form `NNNN` plus `NNP` (PIL under the group). Groups `39` and `40` have no sub-codes. | `sci_subject_category_2025.csv`; PDF `raw/sci-notice-case-categories-2025-04-17.pdf` |
| **Disposal type** | NJDG-SC manual §8.3 and the "Disp.Type" field on the case page | Dismissed, Disposed of, Allowed, Granted, Others, Conditional Order | (F9) |
| **Pendency stage** | NJDG-SC manual §7.3 | Admission Complete, Regular and Ready, Admission Incomplete, Regular Not Ready | (F9) |
| **Party side** | party-name search | `P` Petitioner, `R` Respondent, `any` | `sci_party_type.csv` |
| **Status filter** | party-name search | `P` Pending, `D` Disposed | `sci_case_status_filter.csv` |
| **Lower court (impugned order)** | sci.gov.in/case-status-court: Court → State → Bench → Case Type → Number → Year → **Order Date** | Court: `4` Supreme Court, `1` High Court, `3` District Court, `5` State Agency. States and case types use **SCI-internal ids** (Delhi = `490506`; 761 Delhi HC and 1,038 Delhi district case types). | `sci_lower_court_*.csv` |

**Category codes were reused across versions.** The old `0308` meant a Wealth Tax appeal; under the 2025 scheme `03xx` is Arbitration. A category code without a scheme version is ambiguous, so Setu must store `{scheme: "SCI-2025-04-21", code}`. Annexure B's old-to-new table was too irregular to parse reliably and is not converted. The PDF is the reference.

**The impugned-order link is part of SCI's own data model.** SCI can find an SC case from the lower-court case type, number, year and **order date**. Setu's `impugnedOrder` should therefore hold those same four facts: court, case type, number and order date. The year is derived from the number. A CNR is added when one is known. The HC/DC PDF then verifies them in the Notebook.

## 1e. The CNR method (recommendation for the Setu standard)

Evidence: F4, F5, F17, F18, F20 and §1b.

1. **Identity = CNR, as the court issued it.** Store the 16-character canonical form, uppercase with no separators (Delhi HC shows `DLHC01-014074-2018`, which normalises to `DLHC010140742018`). **Also keep the displayed string verbatim** in the provenance record.
2. **Validate the format only, never the meaning.** The shape is `^[A-Z]{4}\d{2}\d{6}\d{4}$` (4 letters + 2 digits = establishment code, then a 6-digit number, then a 4-digit year). This matches every observed CNR: `SCIN01…`, `DLHC01…`, `DLCT01`. The structure `establishment code + serial + year` is **inferred** from observation plus the CIS 2.0 note. It is not a published specification. No check digit is documented, so Setu must not compute or reject on one.
3. **Do not decode meaning that differs by court.** For SCI the 6-digit part is the **Diary Number** (`069286` ↔ diary `69286/1986`). For the HC/CIS sample it is the **Filing Number**. The standard records `establishmentCode` (the first 6 characters) as a derived field and treats the rest as opaque.
4. **One matter can have several CNRs.** A transfer to another establishment issues a new CNR, and an SLP is a new SCI case with its own `SCIN01…` CNR. Model this as `externalIds: [{scheme: "ecourts-cnr", value, establishmentCode, role: "current" | "previous" | "impugned"}]` and do not overwrite.
5. **Keep the SCI's other identifiers next to the CNR,** because the SCI searches by them:
   - `{scheme: "sci-diary", number, year}`
   - `{scheme: "sci-case", caseTypeCode, numberFrom, numberTo, year}`. The case number can be a **range**, e.g. `SLP(C) No. 001359 - 001378 / 1986`.
6. **Verification is CNR-keyed.** This is the same key the government LIMBS API uses (F17), so a future authorised API slots in without remodelling. Until then, `verify(cnr)` returns `source_unavailable` for automated checks. The lawyer can attach a portal capture as a `Source`, making the result *practitioner-verified*, never *court-verified*.
7. **Changes to `ulos.schema.json`** (applied 2026-11-01, except the 1900 placeholder rule, which belongs in a future importer; no importer exists yet):
   - Add `Matter.externalIds`.
   - Replace the `caseType` enum (`SLP(Crl)`, `SLP(C)`, which are Setu's own labels) with `{scheme: "sci-case-type", code: "2", label: "SPECIAL LEAVE PETITION (CRIMINAL)"}`.
   - Add `subjectCategory {scheme, code}`.
   - Extend `impugnedOrder` with `caseType`, `orderDate` and an optional `cnr`.
   - Treat the `01-01-1900` legacy placeholder date as null.
   - Make the simulated court's diary (`sim/supreme-court/src/registry.ts`, currently `D-YYYY-xxxxxx`) emit a real-shaped `{number, year}` and a `SCIN01` + diary + year CNR, so the simulation's test data (fixtures) look like real court records.

## 1f. ULOS additions: SC e-filing, 3-PDF, neutral citation, ICMIS, legislation (2026-11-01)

The standard is renamed **Uniform Legal Ontology Standard (ULOS)** at the user's direction (`standard/schemas/ulos.schema.json`, `standard/ontology/ulos.jsonld`). The CLI is `ulos`. "Ontology" stays the term for the standard; "taxonomy" here only means the code lists in `sources/taxonomy/`. The user named the domain parts ULOS-L (legislation), ULOS-J (judgments) and ULOS-P (pleadings); this section supplies ULOS-L's first identifier. Code lists are in `sources/taxonomy/`, indexed in `INDEX.csv`. Images in the PDFs were not analysed; everything here comes from their text.

| Finding | Conf. | Source | ULOS change |
|---|---|---|---|
| **ICMIS fetches HC and DC case data by the impugned court's CNR.** AORs are asked to give that CNR in the Proforma for First Listing (FIR and police-station data included). | VO | `raw/sci-circular-icmis-auto-retrieval-2026-05-11.pdf` (F.No.9/Judl./2026) | `impugnedOrder.cnr` description cites it |
| The **SC e-filing manuals**: eFM 2.0 (revised 30.09.2023, efiling.sci.gov.in) and **SCeFM 3.0** (revised 18.11.2025, efiling3.sci.gov.in). The user reports 2.0 as the version in use. 3.0 adds Additional Party, Check List / Declaration, Amicus and Advocate registration, JanParichay SSO, e-Copying, the Appearance portal and **AI Assisted Case Filing** (SLP(C)/SLP(Crl) only, OCR PDF ≤ 50 MB, "Extracted Metadata JSON", user must check). | VO | `raw/sci-efm-2.0-manual.pdf`, `raw/sci-efm-3.0-manual.pdf` | — |
| **Special Category**: none, Death Penalty, Habeas Corpus, Demolition of Property, Eviction, Bail | VO | eFM 2.0 + 3.0, Case Detail | `Matter.specialCategory` |
| **Earlier Courts**: Supreme Court / High Court / District Court / State Agency-Tribunal. Several earlier-court cases can be added, each with order date and order type. | VO | eFM 3.0 §5 | `impugnedOrder.courtType` |
| **Identifiers in filing**: draft number `DRAFT-EC-SCIN01-…-YYYY`, then the **Diary Number**. Misc. Doc. and IA are filed against a Diary Number or Registration Number. Uploads record each PDF's **hash** and page count. | VO | eFM 3.0 | already modelled (`sci-diary`, `Source.hash`) |
| **3-PDF paper book**: a ZIP of Main, Additional and ROP/OR PDFs, bookmarked. "Cite PDF page number while referring to any document". Court No. 1 only at v1.0. | VO | `raw/sci-3pdf-user-manual.pdf` (v1.0, 08.03.2024) | `Source.role = paper-book`, `Source.paperBookPart` |
| **Neutral citation** `2023INSC1` = year + INSC + serial. In force from 2023-07-06; phase I covers judgments from 2014-01-01; QR code on the top left of page 1. | VO (notice text pasted by the user; PDF not yet saved) | — | the existing `NeutralCitation` already matched; description added |
| **verdictfinder.sci.gov.in** (v1.0, 2025): keyword search over SC judgments and orders (Phrase / All Words / Any Words), behind a CAPTCHA, with no documented API. Its place in ULOS is the **retrieval tier for ULOS-J**: find a judgment, then pin it by neutral citation. It is not an identity source. | OO | `portal/sci-verdictfinder.json` | none |
| **India Code** runs on **DSpace 9.1** with an anonymous REST API at `indiacode.gov.in/server/api`. It holds 11,392 Acts, 74,865 Sections, 970 ACT_AMENDMENTs, 20,934 Notifications and more (21 item types). Act identity is `dc.identifier.act_id` (e.g. `AC_CEN_5_0_202609_…`); each Section carries its Act's `act_id` plus `section_id` and `section_number`; there are `repealed` flags. **Handle URIs sometimes point at test hosts**, so they are not identity. | VO (observed API responses) | `raw/indiacode-*.json`; `taxonomy/indiacode_*.csv` | **`LegislationRef`** (ULOS-L), linked from the statute Extract |
| **API Setu, Legislative Department: IndiaCode API** (OAS 3.0, v1.0.0): DSpace endpoints at `beta.api-setu.in` (UAT only), with `X-APISETU-CLIENTID`/`APIKEY` headers. | VO | `raw/apisetu-indiacode-openapi-1.0.0.yaml` | adapter target once keys are obtained |
| **API Setu, NeGD: Nyaykosh "LawAsCode"** (OAS 3.0, GODL licence, production `lawascode.negd.in/laac-api`): `ActDetail` with **`frbrUri`** (Akoma Ntoso), chapters → sections, and `ActAmendment {amendingInstrument, changeType, effectiveDate, textBefore, textAfter}`. **Only 4 Acts** at retrieval. | VO | `raw/apisetu-nyaykosh-openapi-1.0.0.yaml`, `raw/lawascode-*.json` | the model for ULOS-L point-in-time versions; not a coverage source |
| **openjustice-in/ecourts** (GPL-3.0, a third-party scraper): its fixture CNRs (`GAHC040007922024`, `HCBM060000522019`) match the ULOS `Cnr` shape. | SE | GitHub | cite only; GPL code is not copied |

**ULOS-L design note.** The user's draft has CVS checking that a cited section "existed in that exact structural configuration" on the date of offence. India Code gives identity and repeal flags but **no point-in-time text** in the samples. Nyaykosh models amendments with effective dates but covers 4 Acts. Point-in-time verification therefore needs India Code's ACT_AMENDMENT items, or Nyaykosh coverage, before it can be a deterministic gate. Until then, CVS can verify identity (Act + section exists, not flagged repealed) but **not** temporal configuration.

## 2. What this means for Setu (provisional)

- **No court API is available to a private practitioner tool today.** Every verification operation in phase 1 must run from public sources: portal pages viewed by the lawyer, judgment PDFs and the SC/HC judgment portals. Each result must say `source_unavailable` or `unable_to_verify` honestly. It must never say `not_found` when the lookup simply failed.
- **Reuse rather than invent:** the CNR as the primary external case identifier, versioned because of F5; CIS National Codes for case type and acts where they can be obtained; NJDG stage and disposal vocabularies kept verbatim as court-profile enums.
- **The ask to e-Committee becomes concrete:** (a) the Open API endpoint and field dictionary, (b) whether a non-government or Bar-Association-sponsored pilot subscriber category can exist, (c) publication of the National Code masters (case types, acts, disposal natures, stages).
- These support **Option D (hybrid compatibility profiles)**. The verdict so far is **ADOPT WITH LIMITATIONS**, final after phase 2.
- The repo's `standard/schemas/ulos.schema.json` already owns the Source, Extract and CitationVerification concepts. Court identifiers should go there as a profile. A second schema would compete with it.

## 3. Gaps and next actions

1. **Phase 2 is done for SCI and Delhi HC (§1b).** Still open: (a) a **recent** SCI case, so the Listing Dates, Judgement/Orders, Defects and Notices columns can be observed; (b) a Delhi HC case with a non-empty Nature of Disposal and IA Classification; (c) the full e-Filing case-type tree for every Relief Sought group (only 3 sampled); (d) the HC act master, which is broken on the portal.
2. Unresolved retrievals (the network or site refuses automated fetches): the Lok Sabha AU3282 PDF (eparlib.sansad.in times out), the EUR-Lex ECLI texts (blocked), MDDS Demographic v1.1 (empty response), the DPDP corrigendum G.S.R. 892(E), and the API Setu data-standards page. Download these by hand in a browser.
3. Strongest e-Committee ask, now evidence-based (F18): *"the completed eCourts API documentation, and whether a Bar-sponsored or non-government pilot subscriber category is possible."*
4. Licensing: no document reviewed grants a reuse licence. Treat them as **cite, don't copy**. Akoma Ntoso (OASIS), OpenAPI (Apache-2.0), RFC 9457 and W3C PROV-O are reusable under their own terms.

## 4. Source register

See `sources/manifest.tsv` (file, URL, retrieved date, size, type). Publishers: e-Committee SCI, DoJ, DoLA, NIC, Calcutta HC, Sikkim Judicial Academy, NJA, Telangana HC, J&K HC, PIB, MeitY/API Setu, OASIS, OAI, IETF, W3C. One unofficial source is marked in its filename.
