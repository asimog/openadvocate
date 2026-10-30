import type { Hash } from './hash.ts';

export type ClaimId = string & { readonly __brand: 'ClaimId' };

export type Actor = { kind: 'lawyer' | 'agent' | 'system'; id: string };

export type Source = {
  hash: Hash;
  mediaType: string;
  origin: 'upload' | 'capture' | 'corpus';
  url?: string;
};

export type Anchor = {
  source: Hash;
  page: number;
  line?: number;
  para?: string;
  quote: string;
};

type ClaimBase = {
  id: ClaimId;
  text: string;
  anchors: Anchor[];
  dependsOn: ClaimId[];
};

export type Claim =
  | (ClaimBase & {
      kind: 'fact';
      factType: 'date' | 'party' | 'event' | 'allegation' | 'relation' | 'evidence';
    })
  | (ClaimBase & { kind: 'citation'; cite: string })
  | (ClaimBase & {
      kind: 'treatment';
      citing: ClaimId;
      cited: ClaimId;
      treatment: 'followed' | 'distinguished' | 'doubted' | 'overruled';
    })
  | (ClaimBase & { kind: 'argument' });

export type ClaimKind = Claim['kind'];

export type Outcome = 'pass' | 'fail' | 'unresolved';

export type Check = {
  claim: ClaimId;
  claimHash: Hash;
  gate: string;
  outcome: Outcome;
  reason?: string;
};

export type Decision = {
  claim: ClaimId;
  claimHash: Hash;
  accept: boolean;
  rationale?: string;
};

export type EventBody =
  | { type: 'source.added'; source: Source }
  | { type: 'claim.proposed'; claim: Claim }
  | { type: 'check.recorded'; check: Check }
  | { type: 'claim.decided'; decision: Decision };

export type LedgerEvent = {
  seq: number;
  prev: Hash | null;
  at: string;
  actor: Actor;
  body: EventBody;
};

export type Status = 'failed' | 'unresolved' | 'rejected' | 'pending' | 'blocked' | 'verified';
