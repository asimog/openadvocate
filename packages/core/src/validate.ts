import Ajv2020 from 'ajv/dist/2020.js';
import schema from '@vakilbench/standard/schema' with { type: 'json' };

const ajv = new Ajv2020.default({ allErrors: true, strict: true });
ajv.addSchema(schema);

export type DefName = keyof typeof schema.$defs;

export function validate(def: DefName, value: unknown): string[] {
  const check = ajv.getSchema(`${schema.$id}#/$defs/${def}`);
  if (!check) throw new Error(`no schema definition ${def}`);
  if (check(value)) return [];
  return (check.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message ?? 'invalid'}`);
}

export function assertValid<T>(def: DefName, value: T): T {
  const errors = validate(def, value);
  if (errors.length > 0) throw new Error(`invalid ${def}: ${errors.join('; ')}`);
  return value;
}
