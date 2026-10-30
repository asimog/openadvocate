import { hashOf, verifyChain, verifyReceipt, type Defect, type IsoDate, type LedgerEvent, type SignedReceipt } from '@vakilbench/core';
import { matterContext } from '@vakilbench/matter';
import { checkDefects, currentState } from '@vakilbench/pleading';

export type Filing = { events: readonly LedgerEvent[]; receipt: SignedReceipt; document: Uint8Array };
export type RegistryResult = { diary: string } | { defects: Defect[] };

// Advocates-on-Record enrol their signing key once, out of band. A receipt signed by any other
// key is refused, however well formed.
const roll = new Set<string>();
export const enrolAdvocate = (publicKey: string): void => void roll.add(publicKey);

const registryDefect = (code: string, message: string): Defect => ({ code, rule: 'Registry scrutiny of e-filed petition', message });

// The registry trusts nothing the workspace computed. It re-verifies the ledger and the receipt,
// rebuilds the petition's context from the ledger as it stood when the receipt was signed, and
// applies the same defect rules.
export function fileSLP(filing: Filing, today: IsoDate): RegistryResult {
  const { events, receipt, document } = filing;
  if (!verifyChain(events).ok) return { defects: [registryDefect('REG-LEDGER', 'The ledger chain does not verify.')] };
  if (!roll.has(receipt.publicKey)) return { defects: [registryDefect('REG-KEY', 'The receipt is not signed by an enrolled Advocate-on-Record key.')] };

  const check = verifyReceipt(receipt, { document });
  if (!check.ok) return { defects: [registryDefect('REG-RECEIPT', check.reason)] };

  const signedAt = events.findIndex((e) => hashOf(e) === receipt.receipt.ledgerHead);
  if (signedAt < 0) return { defects: [registryDefect('REG-LEDGER-HEAD', 'The receipt names a ledger state that is not in the filed ledger.')] };
  const signed = events.slice(0, signedAt + 1);
  const state = currentState(signed);
  if (state !== 'declaration') {
    return { defects: [registryDefect('REG-PROCEDURE', `The receipt was signed at state ${state}; it must be signed at declaration.`)] };
  }

  const defects = checkDefects(matterContext(signed, { today, receiptSigned: true }));
  if (defects.length > 0) return { defects };
  return { diary: `D-${today.slice(0, 4)}-${receipt.receipt.document.slice(0, 6)}` };
}
