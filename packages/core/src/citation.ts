import type { Citation } from './ulos.gen.ts';

export const normalise = (s: string): string =>
  s
    .normalize('NFKC')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const INSC = /\b(\d{4})\s+INSC\s+(\d+)\b/i;
const SCC = /\((\d{4})\)\s+(\d+)\s+SCC\s+(\d+)\b/i;
const SCR = /\[(\d{4})\]\s+(\d+)\s+S\.?C\.?R\.?\s+(\d+)\b/i;
const AIR = /\bAIR\s+(\d{4})\s+SC\s+(\d+)\b/i;

// Finds every citation in a string, in the order they appear. Used by the Notebook to read
// mentions and by the verifier to canonicalise them, so both apply one grammar.
export function findCitations(text: string): { raw: string; index: number; citation: Citation }[] {
  const found: { raw: string; index: number; citation: Citation }[] = [];
  const scan = (re: RegExp, build: (m: RegExpExecArray) => Citation) => {
    const global = new RegExp(re.source, 'gi');
    for (let m = global.exec(text); m; m = global.exec(text)) {
      found.push({ raw: m[0], index: m.index, citation: build(m) });
    }
  };
  scan(INSC, (m) => ({ scheme: 'INSC', year: Number(m[1]), number: Number(m[2]) }));
  scan(SCC, (m) => ({ scheme: 'SCC', year: Number(m[1]), volume: Number(m[2]), page: Number(m[3]) }));
  scan(SCR, (m) => ({ scheme: 'SCR', year: Number(m[1]), volume: Number(m[2]), page: Number(m[3]) }));
  scan(AIR, (m) => ({ scheme: 'AIR-SC', year: Number(m[1]), volume: 0, page: Number(m[2]) }));
  return found.sort((a, b) => a.index - b.index);
}

export const parseCitation = (raw: string): Citation | null => findCitations(raw)[0]?.citation ?? null;

export function formatCitation(c: Citation): string {
  if (c.scheme === 'INSC') return `${c.year} INSC ${c.number}`;
  if (c.scheme === 'SCC') return `(${c.year}) ${c.volume} SCC ${c.page}`;
  if (c.scheme === 'SCR') return `[${c.year}] ${c.volume} SCR ${c.page}`;
  return `AIR ${c.year} SC ${c.page}`;
}

export const sameCitation = (a: Citation, b: Citation): boolean => formatCitation(a) === formatCitation(b);
