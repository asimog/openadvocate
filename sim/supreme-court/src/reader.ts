import { normalise, type DecisionProvider, type Hash, type LedgerEvent, type Score } from '@vakilbench/core';
import { notebookView, questionFor } from '@vakilbench/notebook';
import { documents } from './gm01.ts';

const STOP = new Set(['the', 'of', 'and', 'a', 'an', 'in', 'to', 'is', 'for', 'on', 'be', 'by', 'that', 'with', 'as', 'or', 'not', 'it', 'its', 'any', 'this', 'are', 'was', 'can', 'may', 'must', 'which', 'under']);
const terms = (s: string) => new Set(normalise(s).split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP.has(t)));

// Share of the proposition's content words the paragraph states, mapped to a probability.
export function supportProbability(proposition: string, paragraph: string): number {
  const wanted = terms(proposition);
  if (wanted.size === 0) return 500;
  const stated = terms(paragraph);
  const share = [...wanted].filter((t) => stated.has(t)).length / wanted.size;
  return share >= 0.6 ? 950 : share <= 0.25 ? 50 : 500;
}

const cleanLine = (source: Hash, page: number, line: number): string | undefined =>
  documents.find((d) => d.source.hash === source)?.engines[0]?.pages[page - 1]?.[line - 1];

// Simulates a Jev/Clef second reader. It never sees the evaluation agent's answer key: it reads the
// court's clean copy of each page to confirm an extract's quote, and reads the cited paragraph to
// judge support. Its answers are computed from evidence, so they can disagree with the Notebook.
export function simulatedReader(events: readonly LedgerEvent[]): DecisionProvider {
  const extracts = new Map(notebookView(events).items.map((i) => [questionFor(i.extract), i.extract]));
  return {
    async ask(state, question): Promise<Score> {
      const score = (probability: number): Score => ({ model: 'fixture', version: 'sim-reader-1', question, probability });
      const extract = extracts.get(question);
      if (extract) {
        const line = cleanLine(extract.anchor.source, extract.anchor.page, extract.anchor.line);
        return score(line !== undefined && normalise(line).includes(normalise(extract.anchor.quote)) ? 950 : 50);
      }
      const proposition = /support the proposition: (.*)\?$/.exec(question)?.[1];
      return score(proposition === undefined ? 500 : supportProbability(proposition, state));
    },
  };
}
