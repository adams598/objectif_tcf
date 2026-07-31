import { NextRequest } from "next/server";
import {
  applyStripeSubscriptionRenewal,
  finalizeSuccessfulPayment,
  markPaymentFailed,
  markPaymentRefundedByStripePaymentIntent,
  markStripeSubscriptionCancelled,
} from "@/lib/payments/service";
import { verifyStripeWebhookSignature } from "@/lib/payments/providers/stripe";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

interface StripeWebhookEvent {
  type?: string;
  data?: {
    object?: {
      metadata?: { tx_ref?: string; payment_id?: string };
      payment_status?: string;
      id?: string;
      payment_intent?: string | { id?: string };
      subscription?: string | { id?: string };
      customer?: string | { id?: string };
      billing_reason?: string;
      amount_paid?: number;
      currency?: string;
      status?: string;
      cancel_at_period_end?: boolean;
    };
  };
}

function extractId(
  value: string | { id?: string } | undefined
): string | undefined {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(signature, rawBody)) {
    return errorResponse("Signature webhook invalide", 401);
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(rawBody) as StripeWebhookEvent;
  } catch {
    return errorResponse("Payload invalide", 400);
  }

  const object = event.data?.object;
  const txRef = object?.metadata?.tx_ref;

  if (event.type === "charge.refunded") {
    const paymentIntentId = extractId(object?.payment_intent);
    if (paymentIntentId) {
      await markPaymentRefundedByStripePaymentIntent(
        paymentIntentId,
        object?.id
      );
    }
    return successResponse({ received: true });
  }

  if (event.type === "invoice.paid") {
    const stripeSubscriptionId = extractId(object?.subscription);
    // Ignorer la première facture déjà traitée via checkout.session.completed
    if (
      stripeSubscriptionId &&
      object?.billing_reason &&
      object.billing_reason !== "subscription_create"
    ) {
      await applyStripeSubscriptionRenewal({
        stripeSubscriptionId,
        stripeCustomerId: extractId(object?.customer),
        stripeInvoiceId: object?.id,
        amountPaid: object?.amount_paid,
        currency: object?.currency,
      });
    }
    return successResponse({ received: true });
  }

  if (
    event.type === "customer.subscription.deleted" ||
    (event.type === "customer.subscription.updated" &&
      object?.status === "canceled")
  ) {
    const stripeSubscriptionId = object?.id;
    if (stripeSubscriptionId) {
      await markStripeSubscriptionCancelled(stripeSubscriptionId, {
        ended: true,
      });
    }
    return successResponse({ received: true });
  }

  if (
    event.type === "customer.subscription.updated" &&
    object?.cancel_at_period_end === true &&
    object?.id
  ) {
    await markStripeSubscriptionCancelled(object.id);
    return successResponse({ received: true });
  }

  if (!txRef) {
    return successResponse({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    if (object?.payment_status === "paid") {
      await finalizeSuccessfulPayment(
        txRef,
        object.id,
        extractId(object.payment_intent),
        {
          subscriptionId: extractId(object.subscription),
          customerId: extractId(object.customer),
        }
      );
    } else {
      await markPaymentFailed(txRef, "Stripe: paiement non confirmé");
    }
  }

  if (event.type === "checkout.session.expired") {
    await markPaymentFailed(txRef, "Session Stripe expirée");
  }

  return successResponse({ received: true });
}
