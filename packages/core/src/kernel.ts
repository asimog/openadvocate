import { hashOf, sha256, type Hash } from './hash.ts';
import { GATES } from './gates.ts';
import { Ledger } from './ledger.ts';
import type { Actor, Check, Claim, ClaimId, Source } from './types.ts';
import { view } from './view.ts';

export type Matter = {
  ledger: Ledger;
  pages: Map<Hash, string[]>;
};

export const openMatter = (): Matter => ({ ledger: new Ledger(), pages: new Map() });

const KERNEL: Actor = { kind: 'system', id: 'kernel' };

export function addSource(
  matter: Matter,
  actor: Actor,
  bytes: Uint8Array,
  pages: string[],
  meta: Omit<Source, 'hash'>,
): Hash {
  const hash = sha256(bytes);
  matter.pages.set(hash, pages);
  matter.ledger.append(actor, { type: 'source.added', source: { ...meta, hash } });
  return hash;
}

export function propose(matter: Matter, actor: Actor, claim: Claim): Check[] {
  matter.ledger.append(actor, { type: 'claim.proposed', claim });
  const claimHash = hashOf(claim);
  const ctx = { pageText: (source: Hash, page: number) => matter.pages.get(source)?.[page - 1] };
  return GATES[claim.kind].map((gate) => {
    const check: Check = { claim: claim.id, claimHash, gate: gate.id, ...gate.run(claim, ctx) };
    matter.ledger.append(KERNEL, { type: 'check.recorded', check });
    return check;
  });
}

export function decide(
  matter: Matter,
  actor: Actor,
  id: ClaimId,
  accept: boolean,
  rationale?: string,
): void {
  if (actor.kind !== 'lawyer') throw new Error(`only a lawyer can decide, got ${actor.kind}`);
  const claim = view(matter.ledger.events).claim(id);
  if (!claim) throw new Error(`unknown claim ${id}`);
  matter.ledger.append(actor, {
    type: 'claim.decided',
    decision: { claim: id, claimHash: hashOf(claim), accept, rationale },
  });
}
