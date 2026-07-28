import { randomUUID } from "crypto";
import { addDaysFromNow } from "@/lib/user/exam-date";
import type {
  ExamType,
  Payment,
  PaymentCurrency,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  EXAM_TAB_TO_TYPE,
  EXAM_TYPE_TO_TAB,
  calculateDynamicPrice,
  type ExamTab,
} from "@/lib/pricing/constants";
import {
  getAmountForCurrency,
  getProviderForMethod,
  usdToEur,
} from "./methods";
import type {
  CheckoutQuote,
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentAmounts,
  PaymentSessionDetails,
} from "./types";
import {
  createPawaPayCheckout,
  isPawaPayConfigured,
} from "./providers/pawapay";
import {
  createStripeCheckout,
  isStripeConfigured,
} from "./providers/stripe";
import {
  createMockCheckout,
  isMockPaymentsEnabled,
  isAnyPaymentProviderConfigured,
} from "./providers/mock";
import { issueInvoiceForPayment } from "@/lib/invoices/issue-invoice";
import { inferSubscriptionPlan } from "@/lib/payments/plan-from-offer";
import type { PaymentInvoiceMetadata } from "@/lib/invoices/types";
import { refundViaProvider } from "./providers/refund";

export function buildProviderReference(): string {
  return `oc_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

import { resolveAppUrl } from "@/lib/env/app-url";

export function getAppUrl(): string {
  return resolveAppUrl();
}

function buildAmounts(
  priceXaf: number,
  priceUsd: number,
  priceXof: number
): PaymentAmounts {
  return {
    xaf: priceXaf,
    xof: priceXof,
    usd: priceUsd,
    eur: usdToEur(priceUsd),
  };
}

export async function resolveCheckoutQuote(input: {
  type: "custom";
  examTab: ExamTab;
  days: number;
} | {
  type: "offer";
  offerId: string;
}): Promise<CheckoutQuote> {
  if (input.type === "custom") {
    const examType = EXAM_TAB_TO_TYPE[input.examTab];
    const config = await prisma.examPricingConfig.findUnique({
      where: { examType },
    });

    const pricing = config ?? {
      pricePerDayXaf: 1000,
      pricePerDayUsd: 2,
      pricePerDayXof: 1250,
    };

    const quote = calculateDynamicPrice(input.days, { examType, ...pricing });

    return {
      examType,
      examTab: input.examTab,
      type: "custom",
      days: quote.days,
      label: `Abonnement ${input.days} jour${quote.days > 1 ? "s" : ""}`,
      amounts: buildAmounts(quote.priceXaf, quote.priceUsd, quote.priceXof),
      subscriptionPlan: inferSubscriptionPlan({ subscriptionDays: quote.days }),
    };
  }

  const offer = await prisma.subscriptionOffer.findFirst({
    where: { id: input.offerId, isActive: true, deletedAt: null },
  });

  if (!offer) {
    throw new Error("OFFER_NOT_FOUND");
  }

  const days = offer.baseDays + offer.bonusDays;
  const subscriptionPlan = inferSubscriptionPlan({
    offerName: offer.name,
    offerSlug: offer.slug,
    subscriptionDays: days,
  });

  return {
    examType: offer.examType,
    examTab: EXAM_TYPE_TO_TAB[offer.examType] ?? "tcf",
    type: "offer",
    days,
    label: offer.name,
    amounts: buildAmounts(offer.priceXaf, offer.priceUsd, offer.priceXof),
    offerId: offer.id,
    offerName: offer.name,
    subscriptionPlan,
  };
}

export async function createPaymentSession(
  userId: string,
  input: {
    type: "custom";
    examTab: ExamTab;
    days: number;
  } | {
    type: "offer";
    offerId: string;
  }
): Promise<Payment> {
  const quote = await resolveCheckoutQuote(input);
  const providerReference = buildProviderReference();

  return prisma.payment.create({
    data: {
      userId,
      providerReference,
      status: "PENDING",
      currency: "XAF",
      amount: quote.amounts.xaf,
      amountXaf: quote.amounts.xaf,
      amountXof: quote.amounts.xof,
      amountUsd: quote.amounts.usd,
      amountEur: quote.amounts.eur,
      examType: quote.examType,
      offerId: quote.offerId,
      subscriptionDays: quote.days,
      description: quote.label,
      metadata: {
        checkoutType: quote.type,
        examTab: quote.examTab,
        offerName: quote.offerName,
        subscriptionPlan: quote.subscriptionPlan ?? "PRO",
      },
    },
  });
}

export function toPaymentSessionDetails(payment: Payment): PaymentSessionDetails {
  return {
    id: payment.id,
    status: payment.status,
    currency: payment.currency,
    amount: payment.amount,
    amounts: {
      xaf: payment.amountXaf ?? payment.amount,
      xof: payment.amountXof ?? payment.amount,
      usd: payment.amountUsd ?? 0,
      eur: payment.amountEur ?? 0,
    },
    description: payment.description,
    examType: payment.examType,
    subscriptionDays: payment.subscriptionDays,
    method: payment.method,
    provider: payment.provider,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function getPaymentForUser(
  paymentId: string,
  userId: string
): Promise<Payment | null> {
  return prisma.payment.findFirst({
    where: { id: paymentId, userId },
  });
}

function resolveProvider(
  method: PaymentMethod,
  currency: PaymentCurrency
): PaymentProvider {
  const preferred = getProviderForMethod(method, currency);

  if (preferred === "STRIPE" && isStripeConfigured()) return "STRIPE";
  if (preferred === "PAWAPAY" && isPawaPayConfigured()) {
    return "PAWAPAY";
  }
  if (isStripeConfigured()) return "STRIPE";
  if (isPawaPayConfigured()) return "PAWAPAY";
  if (isMockPaymentsEnabled()) return "MOCK";

  throw new Error("NO_PAYMENT_PROVIDER_CONFIGURED");
}

export async function initiatePayment(
  input: InitiatePaymentInput,
  user: { userId: string; email: string; name: string }
): Promise<InitiatePaymentResult> {
  const payment = await getPaymentForUser(input.paymentId, user.userId);

  if (!payment) {
    throw new Error("PAYMENT_NOT_FOUND");
  }

  if (payment.status === "SUCCEEDED") {
    throw new Error("PAYMENT_ALREADY_COMPLETED");
  }

  if (!["PENDING", "FAILED", "CANCELLED"].includes(payment.status)) {
    throw new Error("PAYMENT_NOT_PAYABLE");
  }

  const amounts: PaymentAmounts = {
    xaf: payment.amountXaf ?? payment.amount,
    xof: payment.amountXof ?? payment.amount,
    usd: payment.amountUsd ?? 0,
    eur: payment.amountEur ?? 0,
  };

  const amount = getAmountForCurrency(amounts, input.currency);
  const provider = resolveProvider(input.method, input.currency);
  let providerReference = payment.providerReference ?? buildProviderReference();
  const baseUrl = getAppUrl();
  const redirectUrl = `${baseUrl}/offres/paiement/succes?paymentId=${payment.id}`;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { country: true },
  });

  const chargeParams = {
    paymentId: payment.id,
    providerReference,
    amount,
    currency: input.currency,
    method: input.method,
    customerEmail: user.email,
    customerName: user.name,
    description: payment.description ?? "Abonnement Objectif TCF",
    phoneNumber: input.phoneNumber,
    redirectUrl,
  };

  let checkoutUrl: string;
  let externalId: string | undefined;

  if (provider === "MOCK") {
    const mock = createMockCheckout(chargeParams);
    checkoutUrl = mock.checkoutUrl;
    externalId = mock.externalId;
  } else if (provider === "STRIPE") {
    const stripe = await createStripeCheckout(chargeParams);
    checkoutUrl = stripe.checkoutUrl;
    externalId = stripe.externalId;
  } else if (provider === "PAWAPAY") {
    const pp = await createPawaPayCheckout({
      ...chargeParams,
      profileCountry: dbUser?.country,
    });
    checkoutUrl = pp.checkoutUrl;
    providerReference = pp.providerReference;
    externalId = undefined;
  } else {
    throw new Error("NO_PAYMENT_PROVIDER_CONFIGURED");
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PROCESSING",
      provider,
      method: input.method,
      currency: input.currency,
      amount,
      providerReference,
      externalId,
      checkoutUrl,
      failureReason: null,
    },
  });

  return { checkoutUrl, provider, providerReference };
}

export async function finalizeSuccessfulPayment(
  providerReference: string,
  externalId?: string,
  stripePaymentIntentId?: string
): Promise<Payment | null> {
  const payment = await prisma.payment.findUnique({
    where: { providerReference },
  });

  if (!payment) {
    return null;
  }

  if (payment.status === "SUCCEEDED") {
    if (externalId || stripePaymentIntentId) {
      return prisma.payment.update({
        where: { id: payment.id },
        data: {
          externalId: externalId ?? payment.externalId,
          stripePaymentId: stripePaymentIntentId ?? payment.stripePaymentId,
        },
      });
    }
    return payment;
  }

  if (!payment.examType) {
    throw new Error("PAYMENT_MISSING_EXAM_TYPE");
  }

  const now = new Date();
  const days = payment.subscriptionDays ?? 30;
  const metadata = (payment.metadata ?? {}) as PaymentInvoiceMetadata & {
    subscriptionPlan?: string;
  };
  const subscriptionPlan = inferSubscriptionPlan({
    offerName: metadata.offerName,
    subscriptionDays: days,
  });
  const plan =
    (metadata.subscriptionPlan as import("@prisma/client").SubscriptionPlan) ??
    subscriptionPlan;

  const existing = await prisma.subscription.findUnique({
    where: {
      userId_examType: {
        userId: payment.userId,
        examType: payment.examType,
      },
    },
  });

  let subscription;

  if (existing) {
    const extendFrom =
      existing.currentPeriodEnd > now ? existing.currentPeriodEnd : now;
    const periodEnd = new Date(extendFrom);
    periodEnd.setDate(periodEnd.getDate() + days);

    subscription = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan,
        status: "ACTIVE",
        currentPeriodStart: existing.currentPeriodEnd > now ? existing.currentPeriodStart : now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });
  } else {
    const periodEnd = addDaysFromNow(days);

    subscription = await prisma.subscription.create({
      data: {
        userId: payment.userId,
        examType: payment.examType,
        plan,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  await prisma.user.update({
    where: { id: payment.userId },
    data: { targetExamDate: subscription.currentPeriodEnd },
  });

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCEEDED",
      subscriptionId: subscription.id,
      externalId: externalId ?? payment.externalId,
      stripePaymentId: stripePaymentIntentId ?? payment.stripePaymentId,
      paidAt: now,
    },
  });

  void issueInvoiceForPayment(updatedPayment.id).catch((err) => {
    console.error("[Invoice] Failed to issue invoice:", err);
  });

  return updatedPayment;
}

export async function markPaymentFailed(
  providerReference: string,
  reason?: string
): Promise<void> {
  await prisma.payment.updateMany({
    where: { providerReference, status: { not: "SUCCEEDED" } },
    data: {
      status: "FAILED",
      failureReason: reason ?? "Paiement refusé",
    },
  });
}

export async function simulateMockPaymentSuccess(
  paymentId: string,
  userId: string
): Promise<Payment | null> {
  if (!isMockPaymentsEnabled()) {
    throw new Error("MOCK_NOT_ENABLED");
  }

  const payment = await getPaymentForUser(paymentId, userId);
  if (!payment?.providerReference) return null;

  return finalizeSuccessfulPayment(payment.providerReference, payment.externalId ?? undefined);
}

export function mapAdminPaymentRow(payment: Payment & {
  user: { email: string; name: string };
}) {
  return {
    id: payment.id,
    userEmail: payment.user.email,
    userName: payment.user.name,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    provider: payment.provider,
    method: payment.method,
    description: payment.description,
    examType: payment.examType,
    subscriptionDays: payment.subscriptionDays,
    paidAt: payment.paidAt?.toISOString() ?? null,
    createdAt: payment.createdAt.toISOString(),
  };
}

export async function listPaymentsForAdmin(filters?: {
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}) {
  const page = filters?.page ?? 1;
  const limit = Math.min(filters?.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const where = filters?.status ? { status: filters.status } : {};

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    items: items.map(mapAdminPaymentRow),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPaymentStatsForAdmin() {
  const [total, succeeded, pending, failed, revenue] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "SUCCEEDED" } }),
    prisma.payment.count({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED", currency: "XAF" },
      _sum: { amount: true },
    }),
  ]);

  return {
    total,
    succeeded,
    pending,
    failed,
    revenueXaf: revenue._sum.amount ?? 0,
  };
}

export async function refundPaymentForAdmin(
  paymentId: string,
  adminUserId: string,
  reason?: string
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  });

  if (!payment || payment.status !== "SUCCEEDED") {
    throw new Error("PAYMENT_NOT_REFUNDABLE");
  }

  let providerRefund: Awaited<ReturnType<typeof refundViaProvider>> | null = null;

  try {
    if (payment.provider) {
      providerRefund = await refundViaProvider(payment, reason);
    } else if (isMockPaymentsEnabled()) {
      providerRefund = await refundViaProvider(
        { ...payment, provider: "MOCK" },
        reason
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Remboursement provider échoué";
    throw new Error(message);
  }

  const existingMeta =
    typeof payment.metadata === "object" && payment.metadata
      ? (payment.metadata as Record<string, unknown>)
      : {};

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REFUNDED",
      failureReason: reason ?? "Remboursement administrateur",
      metadata: {
        ...existingMeta,
        refundedAt: new Date().toISOString(),
        refundedBy: adminUserId,
        refundProvider: providerRefund?.provider ?? payment.provider,
        refundReference: providerRefund?.refundReference ?? null,
        refundMode: providerRefund?.mode ?? "manual",
      },
    },
  });

  if (payment.subscriptionId) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "CANCELLED",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(),
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "ADMIN_REFUND_PAYMENT",
      entity: "Payment",
      entityId: paymentId,
      metadata: {
        reason,
        providerRefund: providerRefund
          ? {
              provider: providerRefund.provider,
              refundReference: providerRefund.refundReference,
              mode: providerRefund.mode,
            }
          : null,
      },
    },
  });

  return updated;
}

export async function markPaymentRefundedByStripePaymentIntent(
  stripePaymentIntentId: string,
  refundReference?: string
): Promise<void> {
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentId: stripePaymentIntentId },
  });
  if (!payment || payment.status === "REFUNDED") return;

  if (payment.providerReference) {
    await markPaymentRefundedByProvider(payment.providerReference, refundReference);
  }
}

export async function markPaymentRefundedByProvider(
  providerReference: string,
  refundReference?: string
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { providerReference },
  });
  if (!payment || payment.status === "REFUNDED") return;

  const existingMeta =
    typeof payment.metadata === "object" && payment.metadata
      ? (payment.metadata as Record<string, unknown>)
      : {};

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "REFUNDED",
      metadata: {
        ...existingMeta,
        refundedAt: new Date().toISOString(),
        refundReference:
          (refundReference ?? existingMeta.refundReference) as string | null,
        refundSource: "webhook",
      },
    },
  });

  if (payment.subscriptionId) {
    await prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: "CANCELLED",
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(),
      },
    });
  }
}
