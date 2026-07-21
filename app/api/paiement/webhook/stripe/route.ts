import { NextRequest } from "next/server";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
  markPaymentRefundedByStripePaymentIntent,
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
    };
  };
}

function extractPaymentIntentId(
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
    const paymentIntentId = extractPaymentIntentId(object?.payment_intent);
    if (paymentIntentId) {
      await markPaymentRefundedByStripePaymentIntent(
        paymentIntentId,
        object?.id
      );
    }
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
        extractPaymentIntentId(object.payment_intent)
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
