import { readFileSync, writeFileSync } from 'node:fs';
import { compile } from 'json-schema-to-typescript';

const schemaPath = new URL('./schemas/ilo.schema.json', import.meta.url);
const outPath = new URL('../packages/core/src/ilo.gen.ts', import.meta.url);

const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
const ts = await compile(schema, 'ILO', {
  bannerComment: '// Generated from standard/schemas/ilo.schema.json by `pnpm codegen`. Do not edit.',
  unreachableDefinitions: true,
  additionalProperties: false,
  format: true,
});

if (process.argv.includes('--check')) {
  if (readFileSync(outPath, 'utf8') !== ts) {
    console.error('ilo.gen.ts is stale. Run `pnpm codegen`.');
    process.exit(1);
  }
} else {
  writeFileSync(outPath, ts);
}
