import { sameCitation, type Citation, type Judgment } from '@vakilbench/core';
import type { JudgmentSource, Treatment } from '@vakilbench/citations';
import { JUDGMENTS, TREATMENTS } from './corpus.ts';

function tier(
  name: JudgmentSource['tier'],
  snapshot: string,
  holds: (j: Judgment) => boolean,
): JudgmentSource {
  const visible = JUDGMENTS.filter(holds);
  const ids = new Set(visible.map((j) => j.id));
  return {
    tier: name,
    snapshot,
    find: (c: Citation) => visible.filter((j) => j.citations.some((x) => sameCitation(x, c))),
    // A tier can only report treatment by judgments it holds.
    treatments: (id: string): Treatment[] => (TREATMENTS[id] ?? []).filter((t) => ids.has(t.by.id)),
  };
}

export const SNAPSHOT = '2026-03-31';

export const scOfficial = tier('sc-official', '2026-10-30', () => true);

export const corpus = tier('corpus', SNAPSHOT, (j) => j.decided <= SNAPSHOT);

const KANOON_COVERS = new Set(['j-001', 'j-002', 'j-003', 'j-004', 'j-005', 'j-008', 'j-009']);
export const indianKanoon = tier('indian-kanoon', '2026-09-15', (j) => KANOON_COVERS.has(j.id));

// The standard's order. sc-official is first because it is complete, but in practice it needs a human to solve a CAPTCHA.
export const TIERS: JudgmentSource[] = [scOfficial, corpus, indianKanoon];

export const AUTOMATIC_TIERS: JudgmentSource[] = [corpus, indianKanoon];

// The advocate captured a judgment from the Supreme Court site, so that tier is consulted last.
export const withCapture = (tiers: JudgmentSource[]): JudgmentSource[] => [...tiers, scOfficial];
