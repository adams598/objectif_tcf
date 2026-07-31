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

async function stripeFormPost(
  path: string,
  body: URLSearchParams
): Promise<Record<string, unknown>> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as Record<string, unknown> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe ${path} failed`);
  }

  return payload;
}

async function stripeGet(path: string): Promise<Record<string, unknown>> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const payload = (await response.json()) as Record<string, unknown> & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Stripe ${path} failed`);
  }

  return payload;
}

export async function findOrCreateStripeCustomer(params: {
  email: string;
  name: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  if (params.existingCustomerId) {
    try {
      const existing = await stripeGet(`/customers/${params.existingCustomerId}`);
      if (existing.id && !existing.deleted) {
        return String(existing.id);
      }
    } catch {
      // customer introuvable → en créer un nouveau
    }
  }

  const body = new URLSearchParams();
  body.set("email", params.email);
  body.set("name", params.name);
  body.set("metadata[source]", "objectif_tcf");

  const customer = await stripeFormPost("/customers", body);
  return String(customer.id);
}

/**
 * Checkout Stripe en mode abonnement (renouvellement auto selon subscriptionDays).
 * Fallback payment one-shot si pas de durée.
 */
export async function createStripeCheckout(
  params: ProviderChargeParams
): Promise<{
  checkoutUrl: string;
  externalId: string;
  stripeCustomerId?: string;
}> {
  const unitAmount =
    params.currency === "USD" || params.currency === "EUR"
      ? params.amount * 100
      : params.amount;

  const rawDays = params.subscriptionDays ?? 0;
  const useSubscription = rawDays >= 1;
  const days = Math.max(1, Math.min(365, rawDays || 30));

  const customerId = await findOrCreateStripeCustomer({
    email: params.customerEmail,
    name: params.customerName,
    existingCustomerId: params.stripeCustomerId,
  });

  const body = new URLSearchParams();
  body.set("mode", useSubscription ? "subscription" : "payment");
  body.set("success_url", `${params.redirectUrl}?session_id={CHECKOUT_SESSION_ID}`);
  body.set(
    "cancel_url",
    `${resolveAppUrl()}/offres/paiement/annule?paymentId=${params.paymentId}`
  );
  body.set("client_reference_id", params.paymentId);
  body.set("customer", customerId);
  body.set("line_items[0][price_data][currency]", params.currency.toLowerCase());
  body.set(
    "line_items[0][price_data][product_data][name]",
    params.description
  );
  body.set("line_items[0][price_data][unit_amount]", String(unitAmount));
  body.set("line_items[0][quantity]", "1");
  body.set("metadata[payment_id]", params.paymentId);
  body.set("metadata[tx_ref]", params.providerReference);

  if (useSubscription) {
    body.set("line_items[0][price_data][recurring][interval]", "day");
    body.set(
      "line_items[0][price_data][recurring][interval_count]",
      String(days)
    );
    body.set("subscription_data[metadata][tx_ref]", params.providerReference);
    body.set("subscription_data[metadata][payment_id]", params.paymentId);
  }

  for (const type of stripePaymentMethodTypes(params.method)) {
    body.append("payment_method_types[]", type);
  }

  const payload = await stripeFormPost("/checkout/sessions", body);
  const url = payload.url;
  const id = payload.id;

  if (typeof url !== "string" || typeof id !== "string") {
    throw new Error("Stripe checkout failed");
  }

  return {
    checkoutUrl: url,
    externalId: id,
    stripeCustomerId: customerId,
  };
}

export async function cancelStripeSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<void> {
  const body = new URLSearchParams();
  body.set("cancel_at_period_end", "true");
  await stripeFormPost(`/subscriptions/${stripeSubscriptionId}`, body);
}

export async function retrieveStripeSession(
  sessionId: string
): Promise<{ status: "SUCCEEDED" | "FAILED"; txRef: string }> {
  const payload = await stripeGet(`/checkout/sessions/${sessionId}`);

  return {
    status:
      payload.payment_status === "paid" ? "SUCCEEDED" : "FAILED",
    txRef:
      typeof (payload.metadata as { tx_ref?: string } | undefined)?.tx_ref ===
      "string"
        ? String((payload.metadata as { tx_ref: string }).tx_ref)
        : "",
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
  subscriptionId: string | null;
  customerId: string | null;
}> {
  const payload = await stripeGet(`/checkout/sessions/${sessionId}`);

  const paymentIntent = payload.payment_intent;
  const paymentIntentId =
    typeof paymentIntent === "string"
      ? paymentIntent
      : paymentIntent &&
          typeof paymentIntent === "object" &&
          "id" in paymentIntent
        ? String((paymentIntent as { id?: string }).id ?? "") || null
        : null;

  const subscription = payload.subscription;
  const subscriptionId =
    typeof subscription === "string"
      ? subscription
      : subscription &&
          typeof subscription === "object" &&
          "id" in subscription
        ? String((subscription as { id?: string }).id ?? "") || null
        : null;

  const customer = payload.customer;
  const customerId =
    typeof customer === "string"
      ? customer
      : customer && typeof customer === "object" && "id" in customer
        ? String((customer as { id?: string }).id ?? "") || null
        : null;

  return {
    paymentIntentId,
    paymentStatus:
      typeof payload.payment_status === "string" ? payload.payment_status : null,
    subscriptionId,
    customerId,
  };
}

/** Remboursement complet d'une session Checkout Stripe (via PaymentIntent). */
export async function refundStripeCheckoutSession(
  sessionId: string,
  reason?: string
): Promise<{ refundId: string; paymentIntentId: string }> {
  const { paymentIntentId } = await retrieveStripeCheckoutSession(sessionId);
  if (!paymentIntentId) {
    throw new Error("STRIPE_NO_PAYMENT_INTENT");
  }

  const body = new URLSearchParams();
  body.set("payment_intent", paymentIntentId);
  if (reason) {
    body.set("metadata[reason]", reason.slice(0, 500));
  }

  const payload = await stripeFormPost("/refunds", body);
  if (typeof payload.id !== "string") {
    throw new Error("Remboursement Stripe échoué");
  }

  return { refundId: payload.id, paymentIntentId };
}
