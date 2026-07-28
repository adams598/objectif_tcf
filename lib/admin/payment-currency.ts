import type { PaymentCurrency } from "@prisma/client";

/** Taux alignés sur la tarification app (ex. 20 000 XAF ≈ 40 USD). */
export const XAF_PER_USD = 500;
export const XAF_PER_XOF = 1000 / 1250;

export function convertAmountToXaf(
  amount: number,
  currency: PaymentCurrency
): number {
  switch (currency) {
    case "XAF":
      return amount;
    case "XOF":
      return Math.round(amount * XAF_PER_XOF);
    case "USD":
      return Math.round(amount * XAF_PER_USD);
    case "EUR":
      return Math.round((amount / 0.92) * XAF_PER_USD);
    default:
      return amount;
  }
}

export function resolvePaymentAmountXaf(payment: {
  amount: number;
  currency: PaymentCurrency;
  amountXaf?: number | null;
}): number {
  if (payment.amountXaf != null && payment.amountXaf > 0) {
    return payment.amountXaf;
  }
  return convertAmountToXaf(payment.amount, payment.currency);
}

export function sumNativeAndXaf(
  rows: Array<{
    currency: PaymentCurrency;
    amount: number;
    amountXaf?: number | null;
  }>
): Array<{ currency: PaymentCurrency; amount: number; amountXaf: number }> {
  const map = new Map<
    PaymentCurrency,
    { amount: number; amountXaf: number }
  >();

  for (const row of rows) {
    const current = map.get(row.currency) ?? { amount: 0, amountXaf: 0 };
    current.amount += row.amount;
    current.amountXaf += resolvePaymentAmountXaf(row);
    map.set(row.currency, current);
  }

  return Array.from(map.entries())
    .map(([currency, totals]) => ({
      currency,
      amount: totals.amount,
      amountXaf: totals.amountXaf,
    }))
    .sort((a, b) => b.amountXaf - a.amountXaf);
}
