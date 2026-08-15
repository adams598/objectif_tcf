import type { PaymentMethod } from "@prisma/client";
import { resolveAppUrl } from "@/lib/env/app-url";
import type { ProviderChargeParams } from "../types";

/**
 * Intégration Paycard (Guinée) — API adaptée de
 * https://github.com/bmsanoussy/paycard-laravel et paycardjs
 * Base : https://mapaycard.com
 */
const PAYCARD_BASE_URL = "https://mapaycard.com";

type PaycardJumpMethod = "CREDIT_CARD" | "MOMO" | "ORANGE_MONEY" | "PAYCARD";

export type PaycardCreateResponse = {
  code: number;
  payment_amount?: number;
  payment_description?: string;
  operation_reference?: string;
  payment_url?: string;
  error_message?: string | null;
};

export type PaycardStatusResponse = {
  code: number;
  status?: string;
  status_description?: string;
  error_message?: string;
  reference?: string;
  payment_reference?: string | null;
  payment_method?: string | null;
  payment_amount?: string;
};

function getApiKey(): string | null {
  const key = process.env.PAYCARD_API_KEY?.trim();
  if (!key || key === "..." || key.length < 8) return null;
  return key;
}

export function isPaycardConfigured(): boolean {
  return Boolean(getApiKey());
}

/** Préférer Paycard à pawaPay quand les deux sont configurés. */
export function isPaycardPreferred(): boolean {
  return process.env.PAYCARD_PREFERRED?.trim().toLowerCase() === "true";
}

export function mapMethodToPaycard(method: PaymentMethod): PaycardJumpMethod {
  switch (method) {
    case "MOBILE_MONEY_ORANGE":
      return "ORANGE_MONEY";
    case "MOBILE_MONEY_MTN":
    case "MOBILE_MONEY":
      return "MOMO";
    case "CARD":
      return "CREDIT_CARD";
    default:
      return "PAYCARD";
  }
}

export function getPaycardCallbackUrl(): string {
  const override = process.env.PAYCARD_CALLBACK_URL?.trim();
  if (override) return override.replace(/\/$/, "");
  return `${resolveAppUrl()}/api/paiement/webhook/paycard`;
}

export async function createPaycardCheckout(
  params: ProviderChargeParams
): Promise<{ checkoutUrl: string; providerReference: string; externalId?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("PAYCARD_NOT_CONFIGURED");
  }

  const amount = Math.max(1, Math.round(params.amount));
  const jump = mapMethodToPaycard(params.method);
  const body: Record<string, string | number | null> = {
    c: apiKey,
    "paycard-amount": amount,
    "paycard-description": params.description.slice(0, 200),
    "paycard-operation-reference": params.providerReference,
    "paycard-callback-url": getPaycardCallbackUrl(),
    "paycard-auto-redirect": "on",
    // GET obligatoire pour éviter les erreurs CSRF côté apps classiques
    "paycard-redirect-with-get": "on",
  };

  if (jump === "PAYCARD") body["paycard-jump-to-paycard"] = "on";
  if (jump === "CREDIT_CARD") body["paycard-jump-to-cc"] = "on";
  if (jump === "ORANGE_MONEY") body["paycard-jump-to-om"] = "on";
  if (jump === "MOMO") body["paycard-jump-to-momo"] = "on";

  const response = await fetch(`${PAYCARD_BASE_URL}/epay/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let payload: PaycardCreateResponse;
  try {
    payload = (await response.json()) as PaycardCreateResponse;
  } catch {
    throw new Error("PAYCARD_INVALID_RESPONSE");
  }

  if (!response.ok || payload.code !== 0 || !payload.payment_url) {
    throw new Error(
      payload.error_message?.trim() || "Initialisation Paycard échouée"
    );
  }

  return {
    checkoutUrl: payload.payment_url,
    providerReference:
      payload.operation_reference?.trim() || params.providerReference,
    externalId: payload.operation_reference ?? undefined,
  };
}

export async function verifyPaycardPayment(
  reference: string
): Promise<{
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  txRef: string;
  externalId?: string;
  rawStatus?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("PAYCARD_NOT_CONFIGURED");
  }

  const response = await fetch(
    `${PAYCARD_BASE_URL}/epay/${encodeURIComponent(apiKey)}/${encodeURIComponent(reference)}/status`,
    { method: "GET", headers: { Accept: "application/json" } }
  );

  let payload: PaycardStatusResponse;
  try {
    payload = (await response.json()) as PaycardStatusResponse;
  } catch {
    throw new Error("PAYCARD_INVALID_STATUS_RESPONSE");
  }

  if (!response.ok || payload.code !== 0) {
    throw new Error(
      payload.error_message?.trim() || "Vérification Paycard échouée"
    );
  }

  const raw = (payload.status ?? "").toLowerCase();
  const txRef = payload.reference?.trim() || reference;

  if (raw === "success" || raw === "successful" || raw === "completed") {
    return {
      status: "SUCCEEDED",
      txRef,
      externalId: payload.payment_reference ?? undefined,
      rawStatus: payload.status,
    };
  }

  if (
    raw === "failed" ||
    raw === "error" ||
    raw === "cancelled" ||
    raw === "canceled" ||
    raw === "expired"
  ) {
    return {
      status: "FAILED",
      txRef,
      externalId: payload.payment_reference ?? undefined,
      rawStatus: payload.status,
    };
  }

  return {
    status: "PENDING",
    txRef,
    externalId: payload.payment_reference ?? undefined,
    rawStatus: payload.status,
  };
}
