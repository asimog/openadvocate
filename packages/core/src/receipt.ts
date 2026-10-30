import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { canonical, sha256 } from './hash.ts';
import type { Receipt, SignedReceipt } from './ilo.gen.ts';
import { assertValid } from './validate.ts';

export const newSigningKey = (): Uint8Array => ed25519.utils.randomSecretKey();

export function signReceipt(receipt: Receipt, secretKey: Uint8Array): SignedReceipt {
  assertValid('Receipt', receipt);
  return {
    receipt,
    publicKey: bytesToHex(ed25519.getPublicKey(secretKey)),
    signature: bytesToHex(ed25519.sign(utf8ToBytes(canonical(receipt)), secretKey)),
  };
}

export type ReceiptCheck = { ok: true } | { ok: false; reason: string };

export function verifyReceipt(
  signed: SignedReceipt,
  options: { document?: Uint8Array; publicKey?: string } = {},
): ReceiptCheck {
  if (options.publicKey && options.publicKey !== signed.publicKey) {
    return { ok: false, reason: 'signed by an unexpected key' };
  }
  const message = utf8ToBytes(canonical(signed.receipt));
  if (!ed25519.verify(hexToBytes(signed.signature), message, hexToBytes(signed.publicKey))) {
    return { ok: false, reason: 'signature does not match' };
  }
  if (options.document && sha256(options.document) !== signed.receipt.document) {
    return { ok: false, reason: 'document bytes do not match' };
  }
  return { ok: true };
}
