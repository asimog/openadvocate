import { hashOf, type Defect, type IsoDate, type Level } from '@vakilbench/core';
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

// Limitation runs from the order date as the record shows it (a confirmed extract from the impugned
// order itself), not from the date typed at intake.
export const recordedOrderDate = (ctx: PleadingContext): IsoDate | undefined => {
  const order = impugnedOrderSource(ctx);
  const found = ctx.extracts.find(
    (e) => e.status === 'confirmed' && e.extract.kind === 'date' && e.extract.role === 'impugned-order' && e.extract.anchor.source === order?.hash,
  );
  return found?.extract.kind === 'date' ? found.extract.value : undefined;
};

export const withinLimitation = (ctx: PleadingContext): boolean => {
  if (ctx.condonationSought) return true;
  const date = recordedOrderDate(ctx);
  return date !== undefined && ctx.today <= limitationDeadline(date);
};

const passes = (l: Level, allowNotChecked = false) => l.outcome === 'verified' || (allowNotChecked && l.outcome === 'not_checked');

// Every citation the lawyer has not discarded must carry a verdict on its current version that passes.
export function citationProblems(ctx: PleadingContext): { mention: string; problem: string }[] {
  const problems: { mention: string; problem: string }[] = [];
  for (const { extract, status } of ctx.extracts) {
    if (extract.kind !== 'citation' || status === 'rejected') continue;
    if (status === 'failed' || status === 'unresolved') {
      problems.push({ mention: extract.id, problem: `notebook checks ${status}` });
      continue;
    }
    const v = ctx.citations.find((c) => c.mention === extract.id && c.mentionHash === hashOf(extract));
    if (!v) {
      problems.push({ mention: extract.id, problem: 'not verified' });
      continue;
    }
    const failing = [
      ...(['identity', 'standing'] as const).filter((k) => !passes(v[k])).map((k) => `${k} ${v[k].outcome}`),
      ...(passes(v.pinpoint, true) ? [] : [`pinpoint ${v.pinpoint.outcome}`]),
      ...(v.support.outcome === 'failed' ? ['support failed'] : []),
    ];
    if (failing.length > 0) problems.push({ mention: extract.id, problem: failing.join(', ') });
  }
  return problems;
}

export const hasAccepted = (ctx: PleadingContext, kind: 'question-of-law' | 'ground'): boolean =>
  ctx.claims.some((c) => c.claim.kind === kind && c.status === 'accepted');

// true = compliant
export const DEFECT_CHECKS: Record<string, (ctx: PleadingContext) => boolean> = {
  'impugned-order-certified': (ctx) => impugnedOrderSource(ctx)?.certified === true,
  'within-limitation-or-condonation': withinLimitation,
  'citations-verified': (ctx) => citationProblems(ctx).length === 0,
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
