import type { GuardResult, Ledger, LedgerEvent, PleadingState } from '@vakilbench/core';
import { PLEADING, type PleadingContext } from './context.ts';
import { GUARDS, type GuardId } from './guards.ts';

export const TRANSITIONS: readonly { from: PleadingState; to: PleadingState; guards: readonly GuardId[] }[] = [
  { from: 'intake', to: 'record', guards: ['matter-complete'] },
  { from: 'record', to: 'facts', guards: ['impugned-order-present', 'impugned-order-certified'] },
  { from: 'facts', to: 'limitation', guards: ['dates-verified', 'parties-verified'] },
  { from: 'limitation', to: 'authorities', guards: ['within-limitation'] },
  { from: 'authorities', to: 'grounds', guards: ['citations-verified'] },
  { from: 'grounds', to: 'compliance', guards: ['questions-of-law-accepted', 'grounds-accepted'] },
  { from: 'compliance', to: 'declaration', guards: ['defects-clear'] },
  { from: 'declaration', to: 'filed', guards: ['receipt-signed', 'ai-disclosure'] },
  { from: 'filed', to: 'defects-notified', guards: ['registry-defects'] },
  { from: 'defects-notified', to: 'compliance', guards: ['registry-cleared'] },
  { from: 'filed', to: 'registered', guards: ['registry-accepted'] },
];

export function evaluate(
  state: PleadingState,
  ctx: PleadingContext,
): { to: PleadingState; guards: GuardResult[]; ok: boolean }[] {
  return TRANSITIONS.filter((t) => t.from === state).map((t) => {
    const guards = t.guards.map((id) => {
      const guard = GUARDS[id];
      if (!guard) throw new Error(`transition to ${t.to} names unknown guard ${id}`);
      return guard(ctx);
    });
    return { to: t.to, guards, ok: guards.every((g) => g.ok) };
  });
}

export function currentState(events: readonly LedgerEvent[]): PleadingState {
  for (let i = events.length - 1; i >= 0; i--) {
    const body = events[i]!.body;
    if (body.type === 'pleading.transitioned') return body.to;
  }
  return 'intake';
}

export function advance(ledger: Ledger, ctx: PleadingContext): PleadingState | null {
  const from = currentState(ledger.events);
  const passing = evaluate(from, ctx).find((t) => t.ok);
  if (!passing) return null;
  ledger.append(PLEADING, { type: 'pleading.transitioned', from, to: passing.to, guards: passing.guards });
  return passing.to;
}

// Terminates: the only cycle is filed -> defects-notified -> compliance, and the registry guards on it are mutually exclusive.
export function advanceAll(ledger: Ledger, ctx: PleadingContext): PleadingState {
  while (advance(ledger, ctx) !== null);
  return currentState(ledger.events);
}
