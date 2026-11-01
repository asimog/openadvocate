#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { assertValid, verifyReceipt, type SignedReceipt } from '@vakilbench/core';

const [command, receiptPath, publicKey, documentPath] = process.argv.slice(2);

if (command !== 'verify' || !receiptPath || !publicKey) {
  console.error('usage: ulos verify <receipt.json> <expected-public-key-hex> [document]');
  process.exit(2);
}

const signed = assertValid<SignedReceipt>('SignedReceipt', JSON.parse(readFileSync(receiptPath, 'utf8')));
const document = documentPath ? readFileSync(documentPath) : undefined;
const result = verifyReceipt(signed, { document, publicKey });

if (result.ok) {
  const { extracts, verifications } = signed.receipt;
  console.log(`ok: ${extracts.length} extracts, ${verifications.length} citation verifications, document ${signed.receipt.document}`);
} else {
  console.error(`FAIL: ${result.reason}`);
  process.exit(1);
}
