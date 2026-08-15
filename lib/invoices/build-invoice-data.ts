import type {
  Payment,
  PaymentCurrency,
  PaymentMethod,
  PaymentProvider,
  Subscription,
  User,
} from "@prisma/client";
import {
  EXAM_TAB_LABELS,
  EXAM_TYPE_TO_TAB,
} from "@/lib/pricing/constants";
import { formatPaymentAmount, PAYMENT_METHODS } from "@/lib/payments/methods";
import { getAppUrl } from "@/lib/email/config";
import type { InvoiceData, PaymentInvoiceMetadata } from "@/lib/invoices/types";
import { getInvoiceCompanyConfig, getVatMention } from "@/lib/invoices/company-config";
import { generateInvoiceNumber } from "@/lib/invoices/invoice-number";
import { PLAN_LABELS } from "@/lib/admin/analytics";

const PROVIDER_LABELS: Record<PaymentProvider, string> = {
  STRIPE: "Stripe",
  PAWAPAY: "pawaPay",
  PAYCARD: "Paycard",
  PAYPAL: "PayPal",
  CINETPAY: "CinetPay (legacy)",
  FLUTTERWAVE: "Flutterwave (legacy)",
  MOCK: "Mode démo",
};

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTimeFr(date: Date): string {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMethodLabel(method: PaymentMethod | null): string | null {
  if (!method) return null;
  return PAYMENT_METHODS.find((item) => item.id === method)?.label ?? method;
}

export function buildInvoiceData(input: {
  payment: Payment;
  user: Pick<User, "name" | "email" | "firstName" | "lastName">;
  subscription: Pick<
    Subscription,
    "currentPeriodStart" | "currentPeriodEnd" | "examType" | "plan"
  > | null;
}): InvoiceData {
  const { payment, user, subscription } = input;
  const metadata = (payment.metadata ?? {}) as PaymentInvoiceMetadata;
  const paidAt = payment.paidAt ?? payment.updatedAt;
  const examType = payment.examType ?? subscription?.examType ?? "TCF_CANADA";
  const examTab = EXAM_TYPE_TO_TAB[examType];
  const currency = payment.currency as PaymentCurrency;

  const periodStart = subscription?.currentPeriodStart ?? paidAt;
  const periodEnd =
    subscription?.currentPeriodEnd ??
    new Date(paidAt.getTime() + (payment.subscriptionDays ?? 30) * 86400000);

  const customerName =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.name;

  const company = getInvoiceCompanyConfig();
  const vat = getVatMention(currency);
  const planKey = metadata.subscriptionPlan as keyof typeof PLAN_LABELS | undefined;

  return {
    invoiceNumber: generateInvoiceNumber(payment),
    issuedAt: formatDateFr(paidAt),
    paidAt: formatDateTimeFr(paidAt),
    paymentId: payment.id,
    providerReference: payment.providerReference,
    customerName,
    customerEmail: user.email,
    description:
      metadata.offerName ?? payment.description ?? "Abonnement Objectif TCF",
    examTypeLabel: EXAM_TAB_LABELS[examTab ?? "tcf"],
    subscriptionDays: payment.subscriptionDays ?? 0,
    periodStart: formatDateFr(periodStart),
    periodEnd: formatDateFr(periodEnd),
    amount: payment.amount,
    currency,
    amountFormatted: formatPaymentAmount(payment.amount, currency),
    paymentMethod: getMethodLabel(payment.method),
    paymentProvider: payment.provider
      ? PROVIDER_LABELS[payment.provider]
      : null,
    statusLabel: "Payée",
    downloadUrl: `${getAppUrl()}/api/paiement/${payment.id}/facture`,
    pdfDownloadUrl: `${getAppUrl()}/api/paiement/${payment.id}/facture?format=pdf`,
    companyLegalName: company.legalName,
    companyAddress: company.addressLines.join("\n"),
    siret: company.siret,
    vatNumber: company.vatNumber,
    vatMention: vat.rateLabel,
    planLabel: planKey ? PLAN_LABELS[planKey] ?? null : null,
  };
}
