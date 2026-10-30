import type { Defect } from '@vakilbench/core';
import type { PleadingContext } from './context.ts';
import { limitationDeadline } from './limitation.ts';
import rules from '../rules/sc-slp.json' with { type: 'json' };

export type DefectRule = { code: string; rule: string; check: string; message: string; confirmed: boolean };

export const SC_SLP_RULES: DefectRule[] = rules;

export const impugnedOrderSource = (ctx: PleadingContext) => ctx.sources.find((s) => s.role === 'impugned-order');

export const unconfirmed = (ctx: PleadingContext, kind: 'date' | 'party'): string[] =>
  ctx.extracts.filter((e) => e.extract.kind === kind && e.status !== 'confirmed' && e.status !== 'rejected').map((e) => e.extract.id);

export const countOf = (ctx: PleadingContext, kind: 'date' | 'party'): number =>
  ctx.extracts.filter((e) => e.extract.kind === kind && e.status === 'confirmed').length;

export const withinLimitation = (ctx: PleadingContext): boolean =>
  ctx.condonationSought ||
  (ctx.matter !== undefined && ctx.today <= limitationDeadline(ctx.matter.impugnedOrder.date));

export const hasAccepted = (ctx: PleadingContext, kind: 'question-of-law' | 'ground'): boolean =>
  ctx.claims.some((c) => c.claim.kind === kind && c.status === 'accepted');

// true = compliant
export const DEFECT_CHECKS: Record<string, (ctx: PleadingContext) => boolean> = {
  'impugned-order-certified': (ctx) => impugnedOrderSource(ctx)?.certified === true,
  'within-limitation-or-condonation': withinLimitation,
  'list-of-dates-confirmed': (ctx) => ctx.extracts.some((e) => e.extract.kind === 'date' && e.status === 'confirmed'),
  'question-of-law-accepted': (ctx) => hasAccepted(ctx, 'question-of-law'),
  'ground-accepted': (ctx) => hasAccepted(ctx, 'ground'),
  'parties-confirmed': (ctx) => countOf(ctx, 'party') > 0 && unconfirmed(ctx, 'party').length === 0,
  'annexures-are-sources': (ctx) => {
    const hashes = new Set(ctx.sources.map((s) => s.hash));
    return ctx.extracts.every((e) => hashes.has(e.extract.anchor.source));
  },
  'ai-disclosed': (ctx) => ctx.aiDisclosure,
};

export function checkDefects(ctx: PleadingContext, ruleSet: DefectRule[] = SC_SLP_RULES): Defect[] {
  return ruleSet.flatMap((r) => {
    const check = DEFECT_CHECKS[r.check];
    if (!check) throw new Error(`rule ${r.code} names unknown check ${r.check}`);
    return check(ctx) ? [] : [{ code: r.code, rule: r.rule, message: r.message }];
  });
}
