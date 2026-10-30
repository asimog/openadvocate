import { findCitations } from '@vakilbench/core';
import type { Extract, Extract1 } from '@vakilbench/core';

export type Hit = { fields: Extract1; quote: string };
export type Rule = { kind: Extract['kind']; rule: string; find(line: string): Hit[] };

type DateRole = 'impugned-order' | 'offence' | 'arrest' | 'fir' | 'chargesheet' | 'bail-refused' | 'custody-from' | 'other';
type PartyRole = 'petitioner' | 'respondent' | 'appellant' | 'state';
type Act = 'IPC' | 'BNS' | 'CrPC' | 'BNSS' | 'IEA' | 'BSA' | 'Constitution';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const pad = (n: number, w: number) => String(n).padStart(w, '0');

function isoDate(y: number, m: number, d: number): string | null {
  if (y < 1000) return null;
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
  return `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
}

// Order matters: a text naming several events takes the most specific role first.
function roleOf(text: string): DateRole {
  const l = text.toLowerCase();
  if (/\b(dismissed|rejected)\b/.test(l) && /\bbail\b/.test(l)) return 'bail-refused';
  if (/custody since|in custody from/.test(l)) return 'custody-from';
  if (/order dated|impugned/.test(l)) return 'impugned-order';
  if (/offence|occurrence|incident/.test(l)) return 'offence';
  if (/arrest/.test(l)) return 'arrest';
  if (/charge-?sheet/.test(l)) return 'chargesheet';
  if (/\bfir\b/.test(l)) return 'fir';
  return 'other';
}

// A line can hold several events ("dismissed on X; in custody since Y"), so a date reads its own ';' clause and falls back to the whole line.
function dateRole(line: string, at: number): DateRole {
  const start = line.lastIndexOf(';', at) + 1;
  const semi = line.indexOf(';', at);
  const role = roleOf(line.slice(start, semi === -1 ? line.length : semi));
  return role === 'other' ? roleOf(line) : role;
}

const NUM_DATE = /(?<!\d)(\d{1,2})([./-])(\d{1,2})\2(\d{4})(?!\d)/g;
const LONG_DATE = new RegExp(String.raw`(?<!\d)(\d{1,2})(?:st|nd|rd|th)?\s+(${MONTHS.join('|')}),?\s+(\d{4})(?!\d)`, 'gi');

const dateRule: Rule = {
  kind: 'date',
  rule: 'date.dmy',
  find(line) {
    const found: (Hit & { at: number })[] = [];
    for (const m of line.matchAll(NUM_DATE)) {
      const value = isoDate(Number(m[4]), Number(m[3]), Number(m[1]));
      if (value) found.push({ at: m.index, quote: m[0], fields: { kind: 'date', value, role: dateRole(line, m.index) } });
    }
    for (const m of line.matchAll(LONG_DATE)) {
      const value = isoDate(Number(m[3]), MONTHS.indexOf(m[2]!.toLowerCase()) + 1, Number(m[1]));
      if (value) found.push({ at: m.index, quote: m[0], fields: { kind: 'date', value, role: dateRole(line, m.index) } });
    }
    return found.sort((a, b) => a.at - b.at);
  },
};

const ROLE = String.raw`((?:Petitioner|Applicant|Respondent|Appellant)(?:\(s\)|s)?)`;
const NUMBERING = String.raw`^\s*(?:\d+\s*[.)]\s*)?`;
const PARTY_DOTS = new RegExp(String.raw`${NUMBERING}(\S.*?)\s*[.…]{2,}\s*${ROLE}\s*[.,;]?\s*$`, 'id');
const PARTY_PLAIN = new RegExp(String.raw`${NUMBERING}(\S.*?)\s+${ROLE}\s*[.,;]?\s*$`, 'id');
const NAME_PARTICLES = new Set(['of', 'and', 'the', 'alias', 'through', 's/o', 'd/o', 'w/o']);

// Without a dot leader any sentence ending in "the Petitioner" would match, so require a name-shaped prefix.
const looksLikeName = (name: string) => {
  const words = name.split(/\s+/);
  return words.length <= 8 && words.every((w) => NAME_PARTICLES.has(w.toLowerCase()) || !/^\p{Ll}/u.test(w));
};

const partyRule: Rule = {
  kind: 'party',
  rule: 'party.cause-title',
  find(line) {
    const dotted = PARTY_DOTS.exec(line);
    const m = dotted ?? PARTY_PLAIN.exec(line);
    if (!m?.indices) return [];
    const [nameStart, nameEnd] = m.indices[1]!;
    const roleEnd = m.indices[2]![1];
    const name = line.slice(nameStart, nameEnd).replace(/[\s,]+$/, '');
    if (!name || (!dotted && !looksLikeName(name))) return [];
    const word = m[2]!.toLowerCase().replace(/(\(s\)|s)$/, '');
    const role: PartyRole = /^state\s+(?:of\b|\()/i.test(name)
      ? 'state'
      : word === 'applicant'
        ? 'petitioner'
        : (word as PartyRole);
    return [{ quote: line.slice(nameStart, roleEnd), fields: { kind: 'party', value: { name, role } } }];
  },
};

const SEC = String.raw`\d+(?:-?[A-Z]{1,2})?(?:\([0-9a-z]+\))*`;
const ACT = String.raw`(?:IPC|BNSS|BNS|IEA|BSA|Constitution)\b|C[Rr]\.?\s*P\.?\s*C\b\.?`;
const STATUTE = new RegExp(
  String.raw`(?:\b[Ss]ection\(s\)|\b[Ss]ections?|\b[Ss]ec\.|\b[Uu]/[Ss]\.?|\b[Ss]s?\.)\s*(${SEC}(?:\s*(?:,|and|&|/)\s*${SEC})*)\s*(?:(?:of|under)\s+(?:the\s+)?)?(${ACT})`,
  'g',
);

const statuteRule: Rule = {
  kind: 'statute',
  rule: 'statute.section',
  find(line) {
    const hits: Hit[] = [];
    for (const m of line.matchAll(STATUTE)) {
      const raw = m[2]!.replace(/[\s.]/g, '').toUpperCase();
      const act: Act = raw.startsWith('CR') ? 'CrPC' : raw === 'CONSTITUTION' ? 'Constitution' : (raw as Act);
      for (const section of m[1]!.match(new RegExp(SEC, 'g')) ?? []) {
        hits.push({ quote: m[0], fields: { kind: 'statute', act, section } });
      }
    }
    return hits;
  },
};

const CASE_NO = new RegExp(
  String.raw`\b(?:BAIL\s+APPLN\.|CRL\.\s?M\.\s?C\.|CRL\.\s?A\.|CRL\.\s?REV\.\s?P\.|W\.P\.\s?\(CRL\.?\)|FIR\s+No\.|SLP\s*\((?:Crl|C)\)\s*(?:No\.?)?)\s*\d+\s*/\s*\d{4}`,
  'gi',
);
const COURT = /High Court of [A-Z][a-z]+(?: [A-Z][a-z]+)*|Supreme Court of India/;

const caseNumberRule: Rule = {
  kind: 'case-number',
  rule: 'case-number.registry',
  find(line) {
    const court = COURT.exec(line)?.[0] ?? 'unknown';
    return [...line.matchAll(CASE_NO)].map((m) => ({
      quote: m[0],
      fields: { kind: 'case-number', value: m[0].replace(/\s+/g, ' ').replace(/\s*\/\s*/, '/'), court },
    }));
  },
};

const AMOUNT = /(?<![A-Za-z])(?:Rs\.?|INR|₹)\s*(\d+(?:,\d{2,3})*)(\.\d+)?(?:\s*(lakhs?|lacs?|crores?)\b)?(?:\s*\/-)?/gi;

const amountRule: Rule = {
  kind: 'amount',
  rule: 'amount.rupees',
  find(line) {
    const hits: Hit[] = [];
    for (const m of line.matchAll(AMOUNT)) {
      const unit = m[3]?.toLowerCase();
      const exact = Number(m[1]!.replace(/,/g, '') + (m[2] ?? '')) * (!unit ? 1 : unit.startsWith('c') ? 10_000_000 : 100_000);
      const rupees = Math.round(exact);
      // A bare fraction is paise, not integer rupees; with a unit the fraction scales up, so only float noise is rounded away.
      if (Math.abs(exact - rupees) > 1e-6 || !Number.isSafeInteger(rupees)) continue;
      hits.push({ quote: m[0], fields: { kind: 'amount', rupees } });
    }
    return hits;
  },
};

// Words whose trailing period does not end a sentence: name and citation abbreviations, or initials.
const ABBREVIATION = /^(?:(?:[a-z]\.)+|v|vs|ltd|pvt|co|no|nos|mr|mrs|ms|dr|st|smt|shri|sh|anr|ors|etc|inc|corp|govt|dept)\.$/i;

function lastSentenceEnd(text: string): number {
  let end = 0;
  for (const m of text.matchAll(/(\S+?[.!?])\s+(?=\S)/g)) {
    if (!ABBREVIATION.test(m[1]!)) end = m.index + m[0].length;
  }
  return end;
}

const CAP =String.raw`[A-Z][\w.'&()\-]*`;
const NAME = String.raw`${CAP}(?:\s+(?:${CAP}|of|and|the|for|&))*`;
const CASE_NAME = new RegExp(String.raw`(${NAME})\s+(?:v\.|vs\.?)\s+(${NAME}),?\s*$`, 'd');
const LEADING_WORD = /^(?:In|See|Also|Cf\.?|Per|Held)\s+/;
const PINPOINT = /\bpara(?:graph)?s?\.?\s*(\d+)|¶\s*(\d+)/i;
const QUOTED = /["“]([^"“”]+)["”]/;

const citationRule: Rule = {
  kind: 'citation',
  rule: 'citation.mention',
  find(line) {
    const cites = findCitations(line);
    return cites.map((c, i): Hit => {
      const citeEnd = c.index + c.raw.length;
      const prevEnd = i > 0 ? cites[i - 1]!.index + cites[i - 1]!.raw.length : 0;
      const from = prevEnd + lastSentenceEnd(line.slice(prevEnd, c.index));
      const named = CASE_NAME.exec(line.slice(from, c.index));
      let start = c.index;
      if (named?.indices) {
        const lead = LEADING_WORD.exec(named[1]!)?.[0].length ?? 0;
        start = from + named.indices[1]![0] + lead;
      }
      const segment = line.slice(citeEnd, cites[i + 1]?.index ?? line.length);
      const para = PINPOINT.exec(segment);
      const end = para ? citeEnd + para.index + para[0].length : citeEnd;
      const quoted = QUOTED.exec(segment)?.[1];
      const proposition = i === 0 ? line.slice(0, start).trim().replace(/[\s,;:\-–—(]+$/, '') : '';
      const pinpoint = para ? Number(para[1] ?? para[2]) : 0;
      return {
        quote: line.slice(start, end),
        fields: {
          kind: 'citation',
          raw: line.slice(start, citeEnd),
          citation: c.citation,
          ...(pinpoint >= 1 ? { pinpoint } : {}),
          ...(quoted ? { quote: quoted } : {}),
          ...(proposition ? { proposition } : {}),
        },
      };
    });
  },
};

export const RULES: readonly Rule[] = [dateRule, partyRule, statuteRule, caseNumberRule, amountRule, citationRule];
