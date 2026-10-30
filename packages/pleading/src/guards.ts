import type { Defect, GuardResult, Level } from '@vakilbench/core';
import type { PleadingContext } from './context.ts';
import { checkDefects, countOf, hasAccepted, impugnedOrderSource, unconfirmed, withinLimitation } from './defects.ts';

export type GuardId = string;

const result = (guard: GuardId, defects: Defect[]): GuardResult =>
  defects.length === 0 ? { guard, ok: true } : { guard, ok: false, defects };

const defect = (code: string, guard: GuardId, message: string): Defect => ({
  code,
  rule: `SLP state machine, guard ${guard}`,
  message,
});

const need = (guard: GuardId, ok: boolean, code: string, message: string): GuardResult =>
  result(guard, ok ? [] : [defect(code, guard, message)]);

function extractsConfirmed(guard: GuardId, kind: 'date' | 'party'): (ctx: PleadingContext) => GuardResult {
  const tag = kind.toUpperCase();
  return (ctx) => {
    if (countOf(ctx, kind) === 0) return need(guard, false, `G-${tag}-NONE`, `No ${kind} extract exists.`);
    return result(
      guard,
      unconfirmed(ctx, kind).map((id) => defect(`G-${tag}-UNCONFIRMED`, guard, `${kind} extract ${id} is not confirmed.`)),
    );
  };
}

const blocking = (l: Level) => l.outcome === 'failed' || l.outcome === 'unresolved';

export const GUARDS: Record<GuardId, (ctx: PleadingContext) => GuardResult> = {
  'matter-complete': (ctx) => need('matter-complete', ctx.matter !== undefined, 'G-MATTER', 'No matter is open.'),
  'impugned-order-present': (ctx) =>
    need('impugned-order-present', impugnedOrderSource(ctx) !== undefined, 'G-ORDER-MISSING', 'The impugned order is not a source.'),
  'impugned-order-certified': (ctx) =>
    need('impugned-order-certified', impugnedOrderSource(ctx)?.certified === true, 'G-ORDER-UNCERTIFIED', 'The impugned order is not a certified copy.'),
  'dates-verified': extractsConfirmed('dates-verified', 'date'),
  'parties-verified': extractsConfirmed('parties-verified', 'party'),
  'within-limitation': (ctx) =>
    need('within-limitation', withinLimitation(ctx), 'G-LIMITATION', 'Past the limitation period and no condonation is sought.'),
  'citations-verified': (ctx) =>
    result(
      'citations-verified',
      ctx.citations.flatMap((v) => {
        const failing = [
          ...(['identity', 'pinpoint', 'standing'] as const).filter((k) => blocking(v[k])).map((k) => `${k} ${v[k].outcome}`),
          ...(v.support.outcome === 'failed' ? ['support failed'] : []),
        ];
        return failing.length === 0
          ? []
          : [defect('G-CITATION', 'citations-verified', `Citation mention ${v.mention}: ${failing.join(', ')}.`)];
      }),
    ),
  'questions-of-law-accepted': (ctx) =>
    need('questions-of-law-accepted', hasAccepted(ctx, 'question-of-law'), 'G-QUESTION', 'No question of law is accepted.'),
  'grounds-accepted': (ctx) =>
    need('grounds-accepted', hasAccepted(ctx, 'ground'), 'G-GROUND', 'No ground is accepted.'),
  'defects-clear': (ctx) => result('defects-clear', checkDefects(ctx)),
  'receipt-signed': (ctx) => need('receipt-signed', ctx.receiptSigned, 'G-RECEIPT', 'The receipt is not signed.'),
  'ai-disclosure': (ctx) => need('ai-disclosure', ctx.aiDisclosure, 'G-AI', 'The AI-use declaration is not recorded.'),
  'registry-defects': (ctx) =>
    need('registry-defects', !!ctx.registry && 'defects' in ctx.registry && ctx.registry.defects.length > 0, 'G-REGISTRY', 'The registry has returned no defects.'),
  'registry-accepted': (ctx) =>
    need('registry-accepted', !!ctx.registry && 'diary' in ctx.registry, 'G-REGISTRY', 'The registry has not issued a diary number.'),
  'registry-cleared': (ctx) =>
    need('registry-cleared', !ctx.registry || !('defects' in ctx.registry), 'G-REGISTRY', 'The registry defects are still outstanding.'),
};
