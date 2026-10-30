#!/usr/bin/env node
import { createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyReceipt, type SignedReceipt } from '@vakilbench/core';

const [command, receiptPath, keyPath, documentPath] = process.argv.slice(2);

if (command !== 'verify' || !receiptPath || !keyPath) {
  console.error('usage: ilac verify <receipt.json> <public-key.pem> [document]');
  process.exit(2);
}

const signed = JSON.parse(readFileSync(receiptPath, 'utf8')) as SignedReceipt;
const key = createPublicKey(readFileSync(keyPath));
const document = documentPath ? readFileSync(documentPath) : undefined;

if (verifyReceipt(signed, key, document)) {
  console.log(`ok: ${signed.receipt.claims.length} verified claims, document ${signed.receipt.document}`);
} else {
  console.error('FAIL: signature or document hash does not match');
  process.exit(1);
}
