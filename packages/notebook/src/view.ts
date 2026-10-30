import { formatCitation, hashOf, normalise } from '@vakilbench/core';
import type { Extract, Extract1, ExtractCheck, Hash, LedgerEvent, TextLayer } from '@vakilbench/core';

export type ExtractStatus = 'failed' | 'unresolved' | 'checked' | 'confirmed' | 'rejected';
export type NotebookItem = { extract: Extract; hash: Hash; status: ExtractStatus; checks: ExtractCheck[]; line: string };

export const MANDATORY_CHECKS: readonly ExtractCheck['check'][] = ['ocr-agreement', 'anchor', 'value-in-quote'];

// What an extract asserts, ignoring where it was found. A date's role comes from the rest of its
// line, so the role is not part of the value that value-in-quote re-reads from the quote alone.
export function valueOf(e: Extract1): string {
  switch (e.kind) {
    case 'date':
      return e.value;
    case 'party':
      return `${e.value.role}:${normalise(e.value.name)}`;
    case 'statute':
      return `${e.act} ${e.section}`;
    case 'case-number':
      return normalise(e.value);
    case 'amount':
      return String(e.rupees);
    case 'citation':
      return e.citation ? formatCitation(e.citation) : normalise(e.raw);
  }
}

export const questionFor = (extract: Extract): string => `extract:${extract.id}:${valueOf(extract)}`;

export function lineAt(layers: ReadonlyMap<Hash, TextLayer>, source: Hash, page: number, line: number) {
  return layers.get(source)?.pages.find((p) => p.n === page)?.lines.find((l) => l.n === line);
}

export function notebookView(events: readonly LedgerEvent[]): {
  items: NotebookItem[];
  byId(id: string): NotebookItem | undefined;
  layers: TextLayer[];
} {
  const layers = new Map<Hash, TextLayer>();
  const extracts = new Map<string, Extract>();
  const checks = new Map<string, Map<string, ExtractCheck>>();
  const reviews = new Map<string, boolean>();
  const key = (id: string, hash: Hash) => `${id}\n${hash}`;

  for (const { body } of events) {
    if (body.type === 'text.recorded') layers.set(body.layer.source, body.layer);
    else if (body.type === 'extract.recorded') extracts.set(body.extract.id, body.extract);
    else if (body.type === 'extract.checked') {
      const k = key(body.check.extract, body.check.extractHash);
      checks.set(k, (checks.get(k) ?? new Map()).set(body.check.check, body.check));
    } else if (body.type === 'extract.reviewed') reviews.set(key(body.extract, body.extractHash), body.confirm);
  }

  const items = [...extracts.values()].map((extract): NotebookItem => {
    const hash = hashOf(extract);
    const k = key(extract.id, hash);
    const mine = [...(checks.get(k)?.values() ?? [])];
    const line = lineAt(layers, extract.anchor.source, extract.anchor.page, extract.anchor.line);
    const review = reviews.get(k);
    // A lawyer may always discard an extract, but can never confirm past a failed or unresolved check.
    const status: ExtractStatus =
      review === false
        ? 'rejected'
        : mine.some((c) => c.outcome === 'fail')
          ? 'failed'
          : mine.some((c) => c.outcome === 'unresolved') || !MANDATORY_CHECKS.every((n) => mine.some((c) => c.check === n))
            ? 'unresolved'
            : review
              ? 'confirmed'
              : 'checked';
    return { extract, hash, status, checks: mine, line: line ? line.text || line.readings[0].text : '' };
  });
  const byExtractId = new Map(items.map((i) => [i.extract.id, i]));
  return { items, byId: (id) => byExtractId.get(id), layers: [...layers.values()] };
}
