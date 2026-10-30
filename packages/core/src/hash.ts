import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { Hash } from './ilo.gen.ts';

// RFC 8785 subset: sorted keys, no whitespace, integers only so number formatting never varies.
export function canonical(value: unknown): string {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
    throw new Error(`canonical JSON cannot encode ${typeof value}`);
  }
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
      throw new Error(`canonical JSON allows safe integers only, got ${value}`);
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  const entries = Object.entries(value)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
}

export const sha256 = (data: string | Uint8Array): Hash =>
  bytesToHex(nobleSha256(typeof data === 'string' ? utf8ToBytes(data) : data));

export const hashOf = (value: unknown): Hash => sha256(canonical(value));
