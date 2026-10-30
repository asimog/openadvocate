import { validate, type Actor, type Claim, type Ledger, type Ref } from '@vakilbench/core';
import { proposeClaim, type IsGrounded } from './claims.ts';

export type Premise = { ref: Ref; text: string };

export type ArgumentPrompt = {
  issue: string;
  premises: Premise[];
  existing: Claim[];
};

// The only generative port in the system. Implementations call a model (OpenRouter or a local
// endpoint); whatever they return is a candidate until it survives validation and a Case Conference.
export type ArgumentModel = {
  generate(prompt: ArgumentPrompt, origin: Claim['origin']): Promise<Claim[]>;
};

export type Dropped = { claim: unknown; reason: string };

export async function explore(
  ledger: Ledger,
  actor: Actor,
  model: ArgumentModel,
  prompt: ArgumentPrompt,
  isGrounded: IsGrounded,
): Promise<{ proposed: Claim[]; dropped: Dropped[] }> {
  const origin = actor.kind === 'moto' ? 'moto' : 'studio';
  const offered = new Set(prompt.premises.map((p) => `${p.ref.type}:${p.ref.id}`));
  const seen = new Set(prompt.existing.map((c) => c.text.trim().toLowerCase()));
  const proposed: Claim[] = [];
  const dropped: Dropped[] = [];

  for (const claim of await model.generate(prompt, origin)) {
    const reason = rejectionReason(claim, origin, offered, seen, isGrounded);
    if (reason) {
      dropped.push({ claim, reason });
      continue;
    }
    seen.add(claim.text.trim().toLowerCase());
    proposeClaim(ledger, actor, claim);
    proposed.push(claim);
  }
  return { proposed, dropped };
}

function rejectionReason(
  claim: Claim,
  origin: Claim['origin'],
  offered: Set<string>,
  seen: Set<string>,
  isGrounded: IsGrounded,
): string | undefined {
  const errors = validate('Claim', claim);
  if (errors.length > 0) return `invalid: ${errors.join('; ')}`;
  if (claim.origin !== origin) return `origin must be ${origin}`;
  if (claim.groundedIn.length === 0) return 'ungrounded';
  const foreign = claim.groundedIn.find((ref) => !offered.has(`${ref.type}:${ref.id}`));
  if (foreign) return `grounded in ${foreign.type}:${foreign.id}, which was not in the prompt`;
  const unverified = claim.groundedIn.find((ref) => !isGrounded(ref));
  if (unverified) return `grounded in unverified ${unverified.type}:${unverified.id}`;
  if (seen.has(claim.text.trim().toLowerCase())) return 'duplicate';
  return undefined;
}

export function fixtureModel(claims: Claim[]): ArgumentModel {
  return { generate: async (_prompt, origin) => claims.filter((c) => c.origin === origin) };
}
