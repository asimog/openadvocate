import { hashOf } from './hash.ts';
import type { Actor, EventBody, Hash, LedgerEvent } from './ilo.gen.ts';
import { assertValid } from './validate.ts';

export type EventType = EventBody['type'];
export type BodyOf<T extends EventType> = Extract<EventBody, { type: T }>;

// Write ownership is the boundary between products: only the Notebook writes the record,
// only the verifier writes verdicts, only Studio and MOTO propose claims, only the lawyer decides.
export const OWNERS: Record<EventType, readonly Actor['kind'][]> = {
  'matter.opened': ['lawyer'],
  'source.added': ['lawyer', 'court'],
  'text.recorded': ['notebook'],
  'extract.recorded': ['notebook'],
  'extract.checked': ['notebook'],
  'extract.reviewed': ['lawyer'],
  'citation.verified': ['verifier'],
  'claim.proposed': ['studio', 'moto', 'lawyer'],
  'conference.opened': ['lawyer'],
  'conference.decided': ['lawyer'],
  'pleading.transitioned': ['pleading'],
  'pleading.declared': ['lawyer'],
  'pleading.condonation-sought': ['lawyer'],
};

export class Ledger {
  #events: LedgerEvent[] = [];
  #head: Hash | null = null;
  #listeners = new Set<() => void>();

  append(actor: Actor, body: EventBody, at = new Date().toISOString()): LedgerEvent {
    if (!OWNERS[body.type].includes(actor.kind)) {
      throw new Error(`${actor.kind} may not write ${body.type}`);
    }
    const event = assertValid<LedgerEvent>('LedgerEvent', {
      seq: this.#events.length,
      prev: this.#head,
      at,
      actor,
      body,
    });
    this.#head = hashOf(event);
    this.#events.push(event);
    for (const listener of this.#listeners) listener();
    return event;
  }

  get events(): readonly LedgerEvent[] {
    return this.#events;
  }

  get head(): Hash | null {
    return this.#head;
  }

  bodies<T extends EventType>(type: T): BodyOf<T>[] {
    return this.#events.flatMap((e) => (e.body.type === type ? [e.body as BodyOf<T>] : []));
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
}

export type ChainResult = { ok: true; head: Hash | null } | { ok: false; brokenAt: number };

export function verifyChain(events: readonly LedgerEvent[]): ChainResult {
  let prev: Hash | null = null;
  for (const [i, event] of events.entries()) {
    if (event.seq !== i || event.prev !== prev) return { ok: false, brokenAt: i };
    if (!OWNERS[event.body.type]?.includes(event.actor.kind)) return { ok: false, brokenAt: i };
    prev = hashOf(event);
  }
  return { ok: true, head: prev };
}
