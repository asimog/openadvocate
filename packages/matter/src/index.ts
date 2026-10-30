import type { CitationVerification, IsoDate, LedgerEvent, Matter, Ref } from '@vakilbench/core';
import { citationView } from '@vakilbench/citations';
import { notebookView } from '@vakilbench/notebook';
import type { PleadingContext } from '@vakilbench/pleading';
import { studioView } from '@vakilbench/studio';

// Composes the four layers' views into what the procedure needs. The workspace and the court's
// registry both derive context here from the same ledger, so neither has to trust the other's copy.

// Grounding a generated claim needs every level verified; a missing pinpoint is not proof.
export const citationPasses = (v: CitationVerification): boolean =>
  v.identity.outcome === 'verified' &&
  v.pinpoint.outcome === 'verified' &&
  v.support.outcome === 'verified' &&
  v.standing.outcome === 'verified';

export function groundedIn(events: readonly LedgerEvent[]): (ref: Ref) => boolean {
  const notebook = notebookView(events);
  const citations = citationView(events);
  return (ref) => {
    if (ref.type === 'extract') return notebook.byId(ref.id)?.status === 'confirmed';
    if (ref.type === 'verification') {
      const mention = notebook.byId(ref.id);
      const verdict = citations.get(ref.id);
      return mention?.status !== 'rejected' && mention?.status !== 'failed' && !!verdict && citationPasses(verdict);
    }
    return false;
  };
}

export type ContextOptions = {
  today: IsoDate;
  receiptSigned: boolean;
  registry?: PleadingContext['registry'];
};

export function matterContext(events: readonly LedgerEvent[], options: ContextOptions): PleadingContext {
  const bodies = events.map((e) => e.body);
  const matter: Matter | undefined = bodies.flatMap((b) => (b.type === 'matter.opened' ? [b.matter] : [])).at(-1);
  return {
    matter,
    sources: bodies.flatMap((b) => (b.type === 'source.added' ? [b.source] : [])),
    extracts: notebookView(events).items.map((i) => ({ extract: i.extract, status: i.status })),
    citations: [...citationView(events).values()],
    claims: studioView(events, groundedIn(events)).map((i) => ({ claim: i.claim, status: i.status })),
    today: options.today,
    condonationSought: bodies.some((b) => b.type === 'pleading.condonation-sought'),
    aiDisclosure: bodies.some((b) => b.type === 'pleading.declared'),
    receiptSigned: options.receiptSigned,
    registry: options.registry,
  };
}
