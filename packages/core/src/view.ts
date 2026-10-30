import { hashOf, type Hash } from './hash.ts';
import type { Check, Claim, ClaimId, Decision, LedgerEvent, Status } from './types.ts';

export type View = {
  claim(id: ClaimId): Claim | undefined;
  status(id: ClaimId): Status | undefined;
};

export function view(events: readonly LedgerEvent[]): View {
  const claims = new Map<ClaimId, Claim>();
  const checks = new Map<Hash, Check[]>();
  const decisions = new Map<Hash, Decision>();

  for (const { body } of events) {
    if (body.type === 'claim.proposed') claims.set(body.claim.id, body.claim);
    if (body.type === 'check.recorded') {
      const list = checks.get(body.check.claimHash) ?? [];
      list.push(body.check);
      checks.set(body.check.claimHash, list);
    }
    if (body.type === 'claim.decided') decisions.set(body.decision.claimHash, body.decision);
  }

  const memo = new Map<ClaimId, Status>();

  function status(id: ClaimId): Status | undefined {
    const cached = memo.get(id);
    if (cached) return cached;
    const claim = claims.get(id);
    if (!claim) return undefined;
    // A dependency cycle can never be verified; marking before recursing makes it resolve to blocked.
    memo.set(id, 'blocked');
    const result = derive(claim);
    memo.set(id, result);
    return result;
  }

  function derive(claim: Claim): Status {
    const hash = hashOf(claim);
    const own = checks.get(hash) ?? [];
    if (own.some((c) => c.outcome === 'fail')) return 'failed';
    if (own.some((c) => c.outcome === 'unresolved')) return 'unresolved';
    const decision = decisions.get(hash);
    if (!decision) return 'pending';
    if (!decision.accept) return 'rejected';
    if (claim.dependsOn.some((dep) => status(dep) !== 'verified')) return 'blocked';
    return 'verified';
  }

  return { claim: (id) => claims.get(id), status };
}
