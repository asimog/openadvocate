import { verifyReceipt, type Defect, type SignedReceipt } from '@vakilbench/core';
import { checkDefects, type PleadingContext } from '@vakilbench/pleading';

export type Filing = { context: PleadingContext; receipt: SignedReceipt; document: Uint8Array };
export type RegistryResult = { diary: string } | { defects: Defect[] };

export function fileSLP(filing: Filing): RegistryResult {
  const { context, receipt, document } = filing;
  const defects: Defect[] = [];
  const check = verifyReceipt(receipt, { document });
  if (!check.ok) {
    defects.push({ code: 'REG-RECEIPT', rule: 'Registry: receipt must verify against the filed document', message: check.reason });
  }
  defects.push(...checkDefects(context));
  if (defects.length > 0) return { defects };
  return { diary: `D-${context.today.slice(0, 4)}-${receipt.receipt.document.slice(0, 6)}` };
}
