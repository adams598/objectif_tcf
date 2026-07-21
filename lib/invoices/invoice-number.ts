import type { Payment } from "@prisma/client";

export function generateInvoiceNumber(payment: Payment): string {
  const meta = payment.metadata as { invoiceNumber?: string } | null;
  if (meta?.invoiceNumber) {
    return meta.invoiceNumber;
  }

  const date = payment.paidAt ?? payment.createdAt;
  const year = date.getFullYear();
  const suffix = payment.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  return `FAC-${year}-${suffix}`;
}
