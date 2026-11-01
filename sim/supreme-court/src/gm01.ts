import { formatCitation, sha256, type Matter, type Source } from '@vakilbench/core';
import { supportQuestion, type CitationMention } from '@vakilbench/citations';
import { MISSING_CITATION, QUOTES } from './corpus.ts';

// Golden matter GM-01. Everything here is synthetic: the parties, the FIR, the judgments.

export const TODAY = '2026-10-30';

export const matter: Matter = {
  id: 'gm-01',
  title: 'Rakesh Kumar v. State (NCT of Delhi) [synthetic]',
  forum: 'Supreme Court of India',
  caseType: { scheme: 'sci-case-type', code: '2', label: 'SPECIAL LEAVE PETITION (CRIMINAL)' },
  impugnedOrder: { court: 'High Court of Delhi', caseType: 'BAIL APPLN.', caseNumber: 'BAIL APPLN. 1234/2026', date: '2026-08-14' },
  petitionerInCustody: true,
};

export type EngineText = { engine: string; pages: string[][] };
export type GoldenDocument = { source: Source; engines: EngineText[] };

const joinText = (pages: string[][]) => pages.map((p) => p.join('\n')).join('\n\n');

function document(meta: Omit<Source, 'hash'>, pages: string[][], ocrPages: string[][] = pages): GoldenDocument {
  return {
    source: { hash: sha256(joinText(pages)), ...meta },
    engines: [
      { engine: 'pdf-text', pages },
      { engine: 'ocr-tesseract', pages: ocrPages },
    ],
  };
}

const orderPages = [
  [
    'IN THE HIGH COURT OF DELHI AT NEW DELHI',
    'BAIL APPLN. 1234/2026 (High Court of Delhi)',
    'Rakesh Kumar ...Petitioner',
    'Versus',
    'State (NCT of Delhi) ...Respondent',
    'FIR No. 210/2024 dated 29.06.2024, Police Station Sadar Bazar.',
    'The petitioner is accused of an offence under Sections 307 and 34 IPC.',
    'The petitioner has been in custody since 03.07.2024.',
    'Heard learned counsel for the parties.',
    'No ground for bail is made out at this stage.',
    'The bail application is dismissed.',
    'Order dated 14.08.2026',
  ],
  ['Certified to be a true copy of the original.'],
];

const firPages = [
  [
    'FIRST INFORMATION REPORT (EXTRACT)',
    'FIR No. 210/2024 dated 29.06.2024, Police Station Sadar Bazar.',
    'Date of occurrence: 28.06.2024',
    'The informant states that the accused attacked him with a knife.',
    'Sections 307 and 34 IPC',
  ],
];
const firOcrPages = [firPages[0]!.map((l) => l.replace('28.06.2024', '28.08.2024'))];

const custodyPages = [
  [
    'CUSTODY CERTIFICATE',
    'Central Jail No. 4, Tihar',
    'Certified that Rakesh Kumar is in custody since 03.07.2024.',
    'FIR No. 210/2024 dated 29.06.2024, Police Station Sadar Bazar.',
    'His bail application BAIL APPLN. 1243/2026 (High Court of Delhi) is pending.',
  ],
];

export type DraftCitation = {
  label: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';
  proposition: string;
  party: string;
  cite: string;
  pinpoint: number;
  quote: string;
  judgment?: string;
  why: string;
};

// Propositions end on a lowercase word or a number so the extractor reads the case name that follows without absorbing them.
export const DRAFT_CITATIONS: readonly DraftCitation[] = [
  {
    label: 'a',
    proposition: 'Prolonged custody without any prospect of an early trial is a weighty ground for bail under Article 21.',
    party: 'Harinder Singh v. State of Punjab',
    cite: '2021 INSC 114',
    pinpoint: 9,
    quote: QUOTES.prolongedCustody,
    judgment: 'j-001',
    why: 'fully good',
  },
  {
    label: 'b',
    proposition: 'Bail may be refused on apprehended misconduct only if flight, tampering and influence on witnesses are all made out.',
    party: 'Meera Devi v. Union of India',
    cite: '2022 INSC 640',
    pinpoint: 6,
    quote: QUOTES.tripleTest,
    judgment: 'j-002',
    why: 'quote is in paragraph 11, not 6',
  },
  {
    label: 'c',
    proposition: 'The gravity of the offence alone cannot justify refusal of bail.',
    party: 'Farooq Ahmad v. Union Territory of Jammu and Kashmir',
    cite: '(2024) 2 SCC 391',
    pinpoint: 5,
    quote: QUOTES.gravityAlone,
    judgment: 'j-009',
    why: 'paragraph 5 records the appellant counsel submission',
  },
  {
    label: 'd',
    proposition: 'Parity with a co-accused who has been granted bail is by itself a sufficient ground for bail.',
    party: 'Sanjay Verma v. State of Uttar Pradesh',
    cite: '2018 INSC 905',
    pinpoint: 8,
    quote: QUOTES.parity,
    judgment: 'j-003',
    why: 'overruled in 2023 by a bench of five',
  },
  {
    label: 'e',
    proposition: 'Continued detention beyond two years after the investigation is complete needs specific written reasons.',
    party: 'Dinesh Patel v. State of Gujarat',
    cite: '2026 INSC 311',
    pinpoint: 9,
    quote: QUOTES.twoYears,
    judgment: 'j-007',
    why: 'decided after the corpus snapshot; only the Supreme Court site has it',
  },
  {
    label: 'f',
    proposition: 'Bail is the rule and jail the exception.',
    party: 'Ramesh Gupta v. State of Haryana',
    cite: formatCitation(MISSING_CITATION),
    pinpoint: 4,
    quote: QUOTES.ruleNotException,
    why: 'in no source',
  },
  {
    label: 'g',
    proposition: 'An accused who has been in custody for over a year without commencement of trial is ordinarily entitled to bail.',
    party: 'Kavita Rao v. State of Maharashtra',
    cite: '(2019) 3 SCC 456',
    pinpoint: 12,
    quote: QUOTES.oneYear,
    judgment: 'j-005',
    why: 'doubted only by a smaller bench, so still good law',
  },
];

export const draftLine = (d: DraftCitation): string => `${d.proposition} ${d.party}, ${d.cite}, para ${d.pinpoint}, "${d.quote}"`;

const draftPages = [['DRAFT SYNOPSIS AND LIST OF AUTHORITIES (SYNTHETIC)', ...DRAFT_CITATIONS.map(draftLine)]];

export const documents: GoldenDocument[] = [
  document(
    { title: 'Impugned order, BAIL APPLN. 1234/2026', mediaType: 'application/pdf', origin: 'lawyer', role: 'impugned-order', certified: true },
    orderPages,
  ),
  document({ title: 'FIR No. 210/2024 (extract)', mediaType: 'application/pdf', origin: 'lawyer', role: 'fir' }, firPages, firOcrPages),
  document({ title: 'Custody certificate', mediaType: 'application/pdf', origin: 'lawyer', role: 'custody-certificate' }, custodyPages),
  document({ title: 'Draft synopsis (advocate)', mediaType: 'text/plain', origin: 'lawyer', role: 'draft' }, draftPages),
];

export const sourceOf = (role: Source['role']): GoldenDocument => {
  const found = documents.find((d) => d.source.role === role);
  if (!found) throw new Error(`GM-01 has no ${role}`);
  return found;
};

// Where the answer key's planted defects sit: the FIR line the two engines read differently, and the
// custody certificate's wrong case number. Lines are 1-based like the text layer.
export const PLANTED_LOCATIONS = {
  ocrDisagreement: { source: sourceOf('fir').source.hash, page: 1, line: 3 },
  wrongCaseNumber: { source: sourceOf('custody-certificate').source.hash, page: 1, line: 5 },
} as const;
