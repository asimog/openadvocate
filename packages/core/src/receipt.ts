import { sign, verify, type KeyObject } from 'node:crypto';
import { canonical, hashOf, sha256, type Hash } from './hash.ts';
import type { ClaimId, LedgerEvent, Status } from './types.ts';
import { view } from './view.ts';

export type Receipt = {
  document: Hash;
  ledgerHead: Hash;
  claims: { id: ClaimId; hash: Hash; status: Status }[];
};

export type SignedReceipt = { receipt: Receipt; signature: string };

export function issueReceipt(
  events: readonly LedgerEvent[],
  document: Uint8Array,
  ids: ClaimId[],
  key: KeyObject,
): SignedReceipt {
  const last = events.at(-1);
  if (!last) throw new Error('empty ledger');
  const v = view(events);
  const claims = ids.map((id) => {
    const claim = v.claim(id);
    const status = v.status(id);
    if (!claim || status !== 'verified') {
      throw new Error(`claim ${id} is ${status ?? 'unknown'}, not verified`);
    }
    return { id, hash: hashOf(claim), status };
  });
  const receipt: Receipt = { document: sha256(document), ledgerHead: hashOf(last), claims };
  const signature = sign(null, Buffer.from(canonical(receipt)), key).toString('base64');
  return { receipt, signature };
}

export function verifyReceipt(
  signed: SignedReceipt,
  key: KeyObject,
  document?: Uint8Array,
): boolean {
  const message = Buffer.from(canonical(signed.receipt));
  const sigOk = verify(null, message, key, Buffer.from(signed.signature, 'base64'));
  return sigOk && (document === undefined || sha256(document) === signed.receipt.document);
}
