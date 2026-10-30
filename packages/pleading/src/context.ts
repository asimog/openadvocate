import type { Actor, CitationVerification, Claim, Defect, Extract, IsoDate, Matter, Source } from '@vakilbench/core';

export const PLEADING: Actor = { kind: 'pleading', id: 'slp-machine' };

export type ExtractStatus = 'failed' | 'unresolved' | 'checked' | 'confirmed' | 'rejected';
export type ClaimStatus = 'proposed' | 'accepted' | 'rejected' | 'deferred' | 'blocked';

// The machine reads this snapshot and nothing else, so it needs no import from the layers that derive it.
export type PleadingContext = {
  matter: Matter | undefined;
  sources: Source[];
  extracts: { extract: Extract; status: ExtractStatus }[];
  citations: CitationVerification[];
  claims: { claim: Claim; status: ClaimStatus }[];
  today: IsoDate;
  condonationSought: boolean;
  receiptSigned: boolean;
  aiDisclosure: boolean;
  registry?: { defects: Defect[] } | { diary: string };
};
