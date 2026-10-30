import { normalise, type Judgment, type Paragraph } from '@vakilbench/core';

export type Finding = { judgment: Judgment; paragraph: Paragraph; score: number };

const STOP = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'is', 'for', 'on', 'be', 'by', 'that', 'with', 'as', 'or', 'not', 'was', 'it']);

const terms = (s: string) => normalise(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t));

// LegRAA-style research: ranks paragraphs that decide something (holding, analysis, order) by term
// overlap with the question. Every finding is a judgment paragraph, so every answer is anchored.
export function research(question: string, corpus: readonly Judgment[], limit = 10): Finding[] {
  const wanted = new Set(terms(question));
  const findings: Finding[] = [];
  for (const judgment of corpus) {
    for (const paragraph of judgment.paragraphs) {
      if (paragraph.voice === 'facts' || paragraph.voice === 'submission') continue;
      const hits = new Set(terms(paragraph.text).filter((t) => wanted.has(t))).size;
      if (hits > 0) findings.push({ judgment, paragraph, score: Math.round((hits * 1000) / wanted.size) });
    }
  }
  return findings.sort((a, b) => b.score - a.score).slice(0, limit);
}
