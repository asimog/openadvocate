import { hashOf, type Hash } from './hash.ts';
import type { Actor, EventBody, LedgerEvent } from './types.ts';

export class Ledger {
  #events: LedgerEvent[] = [];
  #head: Hash | null = null;

  append(actor: Actor, body: EventBody, at = new Date().toISOString()): LedgerEvent {
    const event: LedgerEvent = { seq: this.#events.length, prev: this.#head, at, actor, body };
    this.#head = hashOf(event);
    this.#events.push(event);
    return event;
  }

  get events(): readonly LedgerEvent[] {
    return this.#events;
  }

  get head(): Hash | null {
    return this.#head;
  }
}

export type ChainResult = { ok: true; head: Hash | null } | { ok: false; brokenAt: number };

export function verifyChain(events: readonly LedgerEvent[]): ChainResult {
  let prev: Hash | null = null;
  for (const [i, event] of events.entries()) {
    if (event.seq !== i || event.prev !== prev) return { ok: false, brokenAt: i };
    prev = hashOf(event);
  }
  return { ok: true, head: prev };
}
