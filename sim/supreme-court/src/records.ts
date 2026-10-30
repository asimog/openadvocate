import { normalise, type IsoDate, type Party } from '@vakilbench/core';

export type CaseRecord = {
  court: string;
  caseNumber: string;
  parties: Party[];
  orderDates: IsoDate[];
  firNumber?: string;
};

const RECORDS: CaseRecord[] = [
  {
    court: 'High Court of Delhi',
    caseNumber: 'BAIL APPLN. 1234/2026',
    parties: [
      { name: 'Rakesh Kumar', role: 'petitioner' },
      { name: 'State (NCT of Delhi)', role: 'respondent' },
    ],
    orderDates: ['2026-08-14'],
    firNumber: '210/2024',
  },
  {
    court: 'High Court of Delhi',
    caseNumber: 'BAIL APPLN. 1243/2025',
    parties: [
      { name: 'Sunil Yadav', role: 'petitioner' },
      { name: 'State (NCT of Delhi)', role: 'respondent' },
    ],
    orderDates: ['2025-11-03'],
  },
];

const keyOf = (court: string, caseNumber: string) => `${normalise(court)}|${normalise(caseNumber)}`;
const byKey = new Map(RECORDS.map((r) => [keyOf(r.court, r.caseNumber), r]));

export const caseRecords = {
  find(court: string, caseNumber: string): CaseRecord | undefined {
    return byKey.get(keyOf(court, caseNumber));
  },
};
