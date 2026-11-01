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

## 2. What this means for Setu (provisional)

- **No court API is available to a private practitioner tool today.** Every verification operation in phase 1 must run from public sources: portal pages viewed by the lawyer, judgment PDFs and the SC/HC judgment portals. Each result must say `source_unavailable` or `unable_to_verify` honestly. It must never say `not_found` when the lookup simply failed.
- **Reuse rather than invent:** the CNR as the primary external case identifier, versioned because of F5; CIS National Codes for case type and acts where they can be obtained; NJDG stage and disposal vocabularies kept verbatim as court-profile enums.
- **The ask to e-Committee becomes concrete:** (a) the Open API endpoint and field dictionary, (b) whether a non-government or Bar-Association-sponsored pilot subscriber category can exist, (c) publication of the National Code masters (case types, acts, disposal natures, stages).
- These support **Option D (hybrid compatibility profiles)**. The verdict so far is **ADOPT WITH LIMITATIONS**, final after phase 2.
- The repo's `standard/schemas/ilo.schema.json` already owns the Source, Extract and CitationVerification concepts. Court identifiers should go there as a profile. A second schema would compete with it.

## 3. Gaps and next actions

1. **Phase 2 (user present, CAPTCHA by hand):** capture exact field labels on the eCourts district case status pages (CNR, case number, party, advocate, FIR, act), the HC services pages, the SCI case status page and judgments.ecourts.gov.in. Record screenshots and do no bulk access. Also try to view the NJDG-HC/DC manuals and the filing.ecourts.gov.in `#manuals` section in a browser; these are not linked as PDFs on the manuals page.
2. Unresolved retrievals (the network or site refuses automated fetches): the Lok Sabha AU3282 PDF (eparlib.sansad.in times out), the EUR-Lex ECLI texts (blocked), MDDS Demographic v1.1 (empty response), the DPDP corrigendum G.S.R. 892(E), and the API Setu data-standards page. Download these by hand in a browser.
3. Strongest e-Committee ask, now evidence-based (F18): *"the completed eCourts API documentation, and whether a Bar-sponsored or non-government pilot subscriber category is possible."*
4. Licensing: no document reviewed grants a reuse licence. Treat them as **cite, don't copy**. Akoma Ntoso (OASIS), OpenAPI (Apache-2.0), RFC 9457 and W3C PROV-O are reusable under their own terms.

## 4. Source register

See `sources/manifest.tsv` (file, URL, retrieved date, size, type). Publishers: e-Committee SCI, DoJ, DoLA, NIC, Calcutta HC, Sikkim Judicial Academy, NJA, Telangana HC, J&K HC, PIB, MeitY/API Setu, OASIS, OAI, IETF, W3C. One unofficial source is marked in its filename.
