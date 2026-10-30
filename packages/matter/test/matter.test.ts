import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CitationVerification, Level } from '@vakilbench/core';
import { citationPasses } from '../src/index.ts';

const ok: Level = { outcome: 'verified' };
const verdict = (over: Partial<CitationVerification> = {}): CitationVerification => ({
  mention: 'c1',
  mentionHash: 'a'.repeat(64),
  tier: 'corpus',
  snapshot: 's',
  identity: ok,
  pinpoint: ok,
  support: ok,
  standing: ok,
  ...over,
});

test('a generated claim can stand only on a citation verified at every level', () => {
  assert.equal(citationPasses(verdict()), true);
  for (const level of ['identity', 'pinpoint', 'support', 'standing'] as const) {
    for (const outcome of ['failed', 'unresolved', 'not_checked'] as const) {
      assert.equal(citationPasses(verdict({ [level]: { outcome } })), false, `${level} ${outcome}`);
    }
  }
});
