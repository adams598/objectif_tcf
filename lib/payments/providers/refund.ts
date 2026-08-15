import type { Payment, PaymentProvider } from "@prisma/client";
import { isMockPaymentsEnabled } from "./mock";
import {
  isStripeConfigured,
  refundStripeCheckoutSession,
} from "./stripe";
import {
  isFlutterwaveConfigured,
  refundFlutterwaveTransaction,
} from "./flutterwave";
import {
  initiatePawaPayRefund,
  isPawaPayConfigured,
  verifyPawaPayCheckout,
} from "./pawapay";

export interface ProviderRefundResult {
  provider: PaymentProvider;
  refundReference: string;
  mode: "provider" | "mock" | "manual";
}

export async function refundViaProvider(
  payment: Payment,
  reason?: string
): Promise<ProviderRefundResult> {
  if (payment.provider === "MOCK" || isMockPaymentsEnabled()) {
    return {
      provider: "MOCK",
      refundReference: `mock_refund_${payment.id}`,
      mode: "mock",
    };
  }

  if (payment.provider === "STRIPE") {
    if (!isStripeConfigured()) {
      throw new Error("STRIPE_NOT_CONFIGURED");
    }
    if (!payment.externalId) {
      throw new Error("STRIPE_MISSING_SESSION_ID");
    }
    const result = await refundStripeCheckoutSession(payment.externalId, reason);
    return {
      provider: "STRIPE",
      refundReference: result.refundId,
      mode: "provider",
    };
  }

  if (payment.provider === "PAWAPAY") {
    if (!isPawaPayConfigured()) {
      throw new Error("PAWAPAY_NOT_CONFIGURED");
    }
    let depositId = payment.externalId;
    if (!depositId && payment.providerReference) {
      const verified = await verifyPawaPayCheckout(payment.providerReference);
      depositId = verified.depositId ?? null;
    }
    if (!depositId) {
      throw new Error("PAWAPAY_MISSING_DEPOSIT_ID");
    }
    const result = await initiatePawaPayRefund(
      depositId,
      payment.amount,
      payment.currency
    );
    return {
      provider: "PAWAPAY",
      refundReference: result.refundReference,
      mode: "provider",
    };
  }

  if (payment.provider === "CINETPAY") {
    return {
      provider: "CINETPAY",
      refundReference: `cinetpay_manual_${payment.externalId ?? payment.id}`,
      mode: "manual",
    };
  }

  if (payment.provider === "PAYCARD") {
    return {
      provider: "PAYCARD",
      refundReference: `paycard_manual_${payment.externalId ?? payment.id}`,
      mode: "manual",
    };
  }

  if (payment.provider === "FLUTTERWAVE") {
    if (!isFlutterwaveConfigured()) {
      throw new Error("FLUTTERWAVE_NOT_CONFIGURED");
    }
    const transactionId = payment.externalId ?? payment.stripePaymentId;
    if (!transactionId) {
      throw new Error("FLUTTERWAVE_MISSING_TRANSACTION_ID");
    }
    const result = await refundFlutterwaveTransaction(
      transactionId,
      payment.amount,
      reason
    );
    return {
      provider: "FLUTTERWAVE",
      refundReference: result.refundReference,
      mode: "provider",
    };
  }

  if (payment.provider === "PAYPAL") {
    throw new Error("PAYPAL_REFUND_NOT_IMPLEMENTED");
  }

  throw new Error("PROVIDER_REFUND_UNSUPPORTED");
}
