import { hashOf, type Actor, type Claim, type ConferenceDecision, type Hash, type Ledger, type LedgerEvent, type Ref } from '@vakilbench/core';

export const STUDIO: Actor = { kind: 'studio', id: 'studio' };
export const MOTO: Actor = { kind: 'moto', id: 'moto' };

// Supplied by the workspace from the other layers: a ref is grounded when the extract is
// confirmed, the citation verification passes, or the claim is accepted.
export type IsGrounded = (ref: Ref) => boolean;

export type ClaimStatus = 'proposed' | 'accepted' | 'rejected' | 'deferred' | 'blocked';

export type StudioItem = {
  claim: Claim;
  hash: Hash;
  status: ClaimStatus;
  decision?: ConferenceDecision;
  ungrounded: Ref[];
};

export function proposeClaim(ledger: Ledger, actor: Actor, claim: Claim): void {
  ledger.append(actor, { type: 'claim.proposed', claim });
}

export function openConference(ledger: Ledger, lawyer: Actor, conference: string, agenda: string[]): void {
  ledger.append(lawyer, { type: 'conference.opened', conference, agenda });
}

export function decideClaim(
  ledger: Ledger,
  lawyer: Actor,
  conference: string,
  claim: Claim,
  decision: ConferenceDecision['decision'],
  rationale: string,
): void {
  const opened = ledger.bodies('conference.opened').some((c) => c.conference === conference && c.agenda.includes(claim.id));
  if (!opened) throw new Error(`claim ${claim.id} is not on the agenda of conference ${conference}`);
  ledger.append(lawyer, {
    type: 'conference.decided',
    decision: { conference, claim: claim.id, claimHash: hashOf(claim), decision, rationale },
  });
}

export function studioView(events: readonly LedgerEvent[], isGrounded: IsGrounded): StudioItem[] {
  const claims = new Map<string, Claim>();
  const decisions = new Map<Hash, ConferenceDecision>();
  for (const { body } of events) {
    if (body.type === 'claim.proposed') claims.set(body.claim.id, body.claim);
    if (body.type === 'conference.decided') decisions.set(body.decision.claimHash, body.decision);
  }

  const items: StudioItem[] = [...claims.values()].map((claim) => {
    const hash = hashOf(claim);
    const decision = decisions.get(hash);
    return { claim, hash, status: decision ? STATUS[decision.decision] : 'proposed', decision, ungrounded: [] };
  });

  // A claim grounded in another claim is grounded only while that claim is accepted and unblocked,
  // so blocking propagates down chains until nothing changes.
  const accepted = new Set(items.filter((i) => i.status === 'accepted').map((i) => i.claim.id));
  const grounded = (ref: Ref) => (ref.type === 'claim' ? accepted.has(ref.id) : isGrounded(ref));
  for (let changed = true; changed; ) {
    changed = false;
    for (const item of items) {
      item.ungrounded = item.claim.groundedIn.filter((ref) => !grounded(ref));
      if (item.ungrounded.length > 0 && item.status !== 'rejected' && item.status !== 'blocked') {
        item.status = 'blocked';
        changed = accepted.delete(item.claim.id) || changed;
      }
    }
  }
  return items;
}

const STATUS: Record<ConferenceDecision['decision'], ClaimStatus> = {
  accept: 'accepted',
  reject: 'rejected',
  defer: 'deferred',
};
