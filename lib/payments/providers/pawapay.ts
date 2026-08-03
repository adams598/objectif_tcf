import { randomUUID } from "crypto";
import type { PaymentCurrency, PaymentMethod } from "@prisma/client";
import { checkoutCountriesForPayment } from "../pawapay-countries";
import type { ProviderChargeParams } from "../types";
import {
  getPawaPayApiBaseUrl,
  getPawaPayApiToken,
  isPawaPayConfigured,
} from "./pawapay-config";

export { isPawaPayConfigured, getPawaPayCallbackUrl } from "./pawapay-config";

export class PawaPayApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number
  ) {
    super(message);
    this.name = "PawaPayApiError";
  }
}

/** Provider pawaPay hinté depuis le moyen choisi côté UI (Cameroun). */
export function providerHintFromMethod(method: PaymentMethod): string | null {
  switch (method) {
    case "MOBILE_MONEY_MTN":
      return "MTN_MOMO_CMR";
    case "MOBILE_MONEY_ORANGE":
      return "ORANGE_MONEY_CMR";
    case "MOBILE_MONEY_AIRTEL":
      return "AIRTEL_OAPI_COG";
    case "MOBILE_MONEY_MOOV":
      return "MOOV_BEN";
    case "MOBILE_MONEY_WAVE":
      return "WAVE_SEN";
    default:
      return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getPawaPayApiToken();
  if (!token) throw new Error("PAWAPAY_NOT_CONFIGURED");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * MSISDN pawaPay : chiffres uniquement, indicatif pays obligatoire, sans « + ».
 * @see https://docs.pawapay.io/v2/docs/deposits
 */
export function normalizeMsisdn(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

async function pawaPayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getPawaPayApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
  });

  let payload: T;
  try {
    payload = (await response.json()) as T;
  } catch {
    throw new PawaPayApiError(
      `Réponse pawaPay invalide (HTTP ${response.status})`,
      response.status
    );
  }

  if (!response.ok) {
    const failure = payload as { failureReason?: { failureMessage?: string } };
    throw new PawaPayApiError(
      failure.failureReason?.failureMessage ??
        `Erreur pawaPay HTTP ${response.status}`,
      response.status
    );
  }

  return payload;
}

/** Vérifie le token via Active Configuration (doc getting started). */
export async function testPawaPayConnection(): Promise<{
  ok: boolean;
  environment: string;
  message: string;
  providersCount?: number;
}> {
  if (!isPawaPayConfigured()) {
    return {
      ok: false,
      environment: "unknown",
      message: "PAWAPAY_API_TOKEN manquant ou invalide dans .env.local",
    };
  }

  try {
    const payload = await pawaPayFetch<{
      status?: string;
      data?: { providers?: unknown[] };
    }>("/v2/active-configuration");

    const count = Array.isArray(payload.data?.providers)
      ? payload.data.providers.length
      : undefined;

    return {
      ok: payload.status === "FOUND" || count != null,
      environment: process.env.PAWAPAY_ENV ?? "sandbox",
      message:
        count != null
          ? `Connexion OK — ${count} opérateur(s) configuré(s) sur le compte`
          : "Connexion OK",
      providersCount: count,
    };
  } catch (error) {
    const message =
      error instanceof PawaPayApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Connexion pawaPay échouée";
    return {
      ok: false,
      environment: process.env.PAWAPAY_ENV ?? "sandbox",
      message,
    };
  }
}

export async function predictPawaPayProvider(
  phoneNumber: string
): Promise<string | null> {
  try {
    const payload = await pawaPayFetch<{
      provider?: string;
    }>("/v2/predict-provider", {
      method: "POST",
      body: JSON.stringify({ phoneNumber: normalizeMsisdn(phoneNumber) }),
    });
    return payload.provider ?? null;
  } catch {
    return null;
  }
}

function checkoutReason(description: string): Record<string, string> {
  const cleaned = description.replace(/[^a-zA-Z0-9 ]/g, " ").trim().slice(0, 22);
  const msg = cleaned.length >= 4 ? cleaned : "Objectif TCF";
  return { fr: msg, en: msg };
}

/**
 * Checkout hébergé pawaPay (API v2).
 * @see https://docs.pawapay.io/v2/docs/checkouts
 */
export async function createPawaPayCheckout(
  params: ProviderChargeParams & { profileCountry?: string | null }
): Promise<{ checkoutUrl: string; providerReference: string }> {
  if (!isPawaPayConfigured()) {
    throw new Error("PAWAPAY_NOT_CONFIGURED");
  }

  const checkoutId = randomUUID();
  const countries = checkoutCountriesForPayment(
    params.currency,
    params.profileCountry
  );
  const amountStr = String(Math.max(1, Math.round(params.amount)));

  const body: Record<string, unknown> = {
    checkoutId,
    returnUrl: params.redirectUrl,
    returnMethod: "COUNTDOWN",
    defaultLanguage: "fr",
    expiresAfter: 30,
    countries,
    amounts: countries.map((country) => ({
      country,
      currency: params.currency,
      amount: amountStr,
    })),
    clientReferenceId: params.paymentId,
    reason: checkoutReason(params.description),
    metadata: [
      { paymentId: params.paymentId },
      { checkoutId, isPII: false },
    ],
  };

  if (params.phoneNumber?.trim()) {
    const phoneNumber = normalizeMsisdn(params.phoneNumber);
    const predicted = await predictPawaPayProvider(phoneNumber);
    const hinted = providerHintFromMethod(params.method);
    // Le numéro prime : le predict-provider pawaPay est plus fiable que l’UI.
    const provider = predicted ?? hinted;
    body.payer = {
      type: "MMO",
      accountDetails: {
        phoneNumber,
        ...(provider ? { provider } : {}),
        allowCustomerToOverride: true,
      },
    };
  }

  const payload = await pawaPayFetch<{
    status?: string;
    redirectUrl?: string;
    failureReason?: { failureMessage?: string; failureCode?: string };
  }>("/v2/checkouts", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (
    payload.status !== "ACCEPTED" &&
    payload.status !== "DUPLICATE_IGNORED"
  ) {
    const detail =
      payload.failureReason?.failureMessage ??
      payload.failureReason?.failureCode ??
      "Initialisation pawaPay échouée";
    throw new PawaPayApiError(detail);
  }

  if (!payload.redirectUrl) {
    throw new PawaPayApiError("pawaPay n'a pas renvoyé d'URL de paiement");
  }

  return {
    checkoutUrl: payload.redirectUrl,
    providerReference: checkoutId,
  };
}

export async function verifyPawaPayCheckout(
  checkoutId: string
): Promise<{
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  txRef: string;
  depositId?: string;
}> {
  if (!isPawaPayConfigured()) {
    throw new Error("PAWAPAY_NOT_CONFIGURED");
  }

  const payload = await pawaPayFetch<{
    status?: string;
    data?: {
      status?: string;
      deposit?: { depositId?: string; status?: string };
    };
  }>(`/v2/checkouts/${checkoutId}`);

  if (payload.status !== "FOUND" || !payload.data) {
    return { status: "PENDING", txRef: checkoutId };
  }

  const checkout = payload.data;
  const checkoutStatus = checkout.status?.toUpperCase();

  if (checkoutStatus === "COMPLETED") {
    return {
      status: "SUCCEEDED",
      txRef: checkoutId,
      depositId: checkout.deposit?.depositId,
    };
  }

  if (
    checkoutStatus === "FAILED" ||
    checkoutStatus === "EXPIRED" ||
    checkoutStatus === "CANCELLED"
  ) {
    return { status: "FAILED", txRef: checkoutId };
  }

  return { status: "PENDING", txRef: checkoutId };
}

export async function verifyPawaPayDeposit(
  depositId: string
): Promise<{ status: "SUCCEEDED" | "FAILED" | "PENDING" }> {
  const payload = await pawaPayFetch<{
    status?: string;
    data?: { status?: string };
  }>(`/v2/deposits/${depositId}`);

  if (payload.status !== "FOUND" || !payload.data) {
    return { status: "PENDING" };
  }

  const depositStatus = payload.data.status?.toUpperCase();
  if (depositStatus === "COMPLETED") return { status: "SUCCEEDED" };
  if (depositStatus === "FAILED") return { status: "FAILED" };
  return { status: "PENDING" };
}

export async function initiatePawaPayRefund(
  depositId: string,
  amount: number,
  currency: PaymentCurrency
): Promise<{ refundReference: string }> {
  const refundId = randomUUID();
  const payload = await pawaPayFetch<{
    status?: string;
    refundId?: string;
    failureReason?: { failureMessage?: string };
  }>("/v2/refunds", {
    method: "POST",
    body: JSON.stringify({
      refundId,
      depositId,
      amount: String(Math.max(1, Math.round(amount))),
      currency,
    }),
  });

  if (payload.status !== "ACCEPTED" && payload.status !== "DUPLICATE_IGNORED") {
    throw new Error(
      payload.failureReason?.failureMessage ?? "Remboursement pawaPay échoué"
    );
  }

  return { refundReference: payload.refundId ?? refundId };
}

export function parsePawaPayCallback(body: Record<string, unknown>): {
  checkoutId?: string;
  depositId?: string;
  paymentId?: string;
  status?: string;
  kind: "checkout" | "deposit" | "unknown";
} {
  const checkoutId =
    typeof body.checkoutId === "string" ? body.checkoutId : undefined;
  const status = typeof body.status === "string" ? body.status : undefined;
  const clientReferenceId =
    typeof body.clientReferenceId === "string"
      ? body.clientReferenceId
      : undefined;

  const deposit = body.deposit as { depositId?: string; status?: string } | undefined;
  const depositId =
    deposit?.depositId ??
    (typeof body.depositId === "string" ? body.depositId : undefined);

  const kind: "checkout" | "deposit" | "unknown" = checkoutId
    ? "checkout"
    : depositId
      ? "deposit"
      : "unknown";

  return {
    checkoutId,
    depositId,
    paymentId: clientReferenceId,
    status: status ?? deposit?.status,
    kind,
  };
}

export function isPawaPayMethod(method: PaymentMethod): boolean {
  return [
    "MOBILE_MONEY",
    "MOBILE_MONEY_MTN",
    "MOBILE_MONEY_ORANGE",
    "MOBILE_MONEY_AIRTEL",
    "MOBILE_MONEY_WAVE",
    "MOBILE_MONEY_MOOV",
    "BANK_TRANSFER",
  ].includes(method);
}
