import { fixtureDecider, type DecisionProvider, type LedgerEvent } from '@vakilbench/core';
import { notebookView, questionFor } from '@vakilbench/notebook';
import { ANSWER_KEY, sameExtract } from './eval.ts';
import { deciderAnswers } from './gm01.ts';

// Simulates a calibrated Jev/Clef second reader for GM-01: it agrees with extracts that are true
// to the record and disagrees with the rest, so the second opinion is an independent check, not a stamp.
export function simulatedReader(events: readonly LedgerEvent[]): DecisionProvider {
  const answers: Record<string, number> = { ...deciderAnswers };
  for (const { extract } of notebookView(events).items) {
    answers[questionFor(extract)] = ANSWER_KEY.extracts.some((x) => sameExtract(extract, x)) ? 950 : 50;
  }
  return fixtureDecider(answers);
}
