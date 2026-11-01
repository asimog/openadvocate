import type { Score } from './ulos.gen.ts';

// The Jev/Clef port. A decision model answers a yes/no question about a state with a probability.
// Its score is a second, independent opinion recorded next to deterministic checks; it never decides alone.
export type DecisionProvider = {
  ask(state: string, question: string): Promise<Score>;
};

export type Band = 'yes' | 'no' | 'unsure';

// Three-band routing. Thresholds are placeholders until calibrated on lawyer-labelled sets.
export const band = (score: Score, yesAt = 900, noAt = 100): Band =>
  score.probability >= yesAt ? 'yes' : score.probability <= noAt ? 'no' : 'unsure';

// Deterministic backend for tests and the simulated court: answers by looking up the question.
export function fixtureDecider(answers: Record<string, number>, fallback = 500): DecisionProvider {
  return {
    async ask(_state, question) {
      return { model: 'fixture', version: '0', question, probability: answers[question] ?? fallback };
    },
  };
}
