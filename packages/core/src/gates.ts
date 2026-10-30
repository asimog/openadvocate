import type { Hash } from './hash.ts';
import type { Claim, ClaimKind, Outcome } from './types.ts';

export type GateContext = {
  pageText(source: Hash, page: number): string | undefined;
};

export type GateResult = { outcome: Outcome; reason?: string };

export type Gate = {
  id: string;
  run(claim: Claim, ctx: GateContext): GateResult;
};

export const normalise = (s: string): string =>
  s
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

export const anchored: Gate = {
  id: 'anchored',
  run(claim, ctx) {
    if (claim.anchors.length === 0) return { outcome: 'fail', reason: 'no_anchor' };
    for (const anchor of claim.anchors) {
      const text = ctx.pageText(anchor.source, anchor.page);
      if (text === undefined) return { outcome: 'unresolved', reason: 'source_missing' };
      if (!normalise(text).includes(normalise(anchor.quote))) {
        return { outcome: 'fail', reason: 'quote_not_found' };
      }
    }
    return { outcome: 'pass' };
  },
};

const INSC = /^\d{4} INSC \d+$/;

export const citationParses: Gate = {
  id: 'citation-parses',
  run(claim) {
    if (claim.kind !== 'citation') return { outcome: 'pass' };
    return INSC.test(claim.cite.trim())
      ? { outcome: 'pass' }
      : { outcome: 'fail', reason: 'unparsed_citation' };
  },
};

export const GATES: Record<ClaimKind, readonly Gate[]> = {
  fact: [anchored],
  citation: [citationParses, anchored],
  treatment: [anchored],
  argument: [anchored],
};
