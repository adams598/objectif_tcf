import { createHmac, timingSafeEqual } from "crypto";
import type { PaymentMethod } from "@prisma/client";
import { resolveAppUrl } from "@/lib/env/app-url";
import type { ProviderChargeParams } from "../types";

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return Boolean(key && key.startsWith("sk_"));
}

function stripePaymentMethodTypes(method: PaymentMethod): string[] {
  if (method === "SEPA") return ["sepa_debit"];
  if (method === "GOOGLE_PAY") return ["card"];
  return ["card"];
}

export async function createStripeCheckout(
  params: ProviderChargeParams
): Promise<{ checkoutUrl: string; externalId: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const unitAmount =
    params.currency === "USD" || params.currency === "EUR"
      ? params.amount * 100
      : params.amount;

  const body = new URLSearchParams();
  body.set("mode", "payment");
  body.set("success_url", `${params.redirectUrl}?session_id={CHECKOUT_SESSION_ID}`);
  body.set(
    "cancel_url",
    `${resolveAppUrl()}/offres/paiement/annule?paymentId=${params.paymentId}`
  );
  body.set("client_reference_id", params.paymentId);
  body.set("customer_email", params.customerEmail);
  body.set("line_items[0][price_data][currency]", params.currency.toLowerCase());
  body.set(
    "line_items[0][price_data][product_data][name]",
    params.description
  );
  body.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[payment_id]", params.paymentId);
  body.set("metadata[tx_ref]", params.providerReference);

  for (const type of stripePaymentMethodTypes(params.method)) {
    body.append("payment_method_types[]", type);
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.url || !payload.id) {
    throw new Error(payload.error?.message ?? "Stripe checkout failed");
  }

  return { checkoutUrl: payload.url, externalId: payload.id };
}

export async function retrieveStripeSession(
  sessionId: string
): Promise<{ status: "SUCCEEDED" | "FAILED"; txRef: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  const payload = (await response.json()) as {
    payment_status?: string;
    metadata?: { tx_ref?: string };
  };

  return {
    status:
      payload.payment_status === "paid" ? "SUCCEEDED" : "FAILED",
    txRef: payload.metadata?.tx_ref ?? "",
  };
}

export function verifyStripeWebhookSignature(
  signature: string | null,
  rawBody: string
): boolean {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  const parts = signature.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const sig = parts.v1;
  if (!timestamp || !sig) return false;

  try {
    const signed = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", webhookSecret)
      .update(signed)
      .digest("hex");
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<{
  paymentIntentId: string | null;
  paymentStatus: string | null;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );

  const payload = (await response.json()) as {
    payment_intent?: string | { id?: string } | null;
    payment_status?: string;
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? "Stripe session introuvable");
  }

  const paymentIntent = payload.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent?.id ?? null;

  return {
    paymentIntentId,
    paymentStatus: payload.payment_status ?? null,
  };
}

/** Remboursement complet d'une session Checkout Stripe (via PaymentIntent). */
export async function refundStripeCheckoutSession(
  sessionId: string,
  reason?: string
): Promise<{ refundId: string; paymentIntentId: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const { paymentIntentId } = await retrieveStripeCheckoutSession(sessionId);
  if (!paymentIntentId) {
    throw new Error("STRIPE_NO_PAYMENT_INTENT");
  }

  const body = new URLSearchParams();
  body.set("payment_intent", paymentIntentId);
  if (reason) {
    body.set("metadata[reason]", reason.slice(0, 500));
  }

  const response = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as {
    id?: string;
    status?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.id) {
    throw new Error(payload.error?.message ?? "Remboursement Stripe échoué");
  }

  return { refundId: payload.id, paymentIntentId };
}
