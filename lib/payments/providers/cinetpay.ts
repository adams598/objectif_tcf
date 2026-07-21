import type { PaymentMethod } from "@prisma/client";
import type { ProviderChargeParams } from "../types";

const CINETPAY_API = "https://api-checkout.cinetpay.com/v2";

function cinetPayChannelsForMethod(method: PaymentMethod): string {
  switch (method) {
    case "MOBILE_MONEY":
    case "MOBILE_MONEY_MTN":
    case "MOBILE_MONEY_ORANGE":
    case "MOBILE_MONEY_AIRTEL":
    case "MOBILE_MONEY_WAVE":
    case "MOBILE_MONEY_MOOV":
      return "MOBILE_MONEY";
    case "CARD":
      return "CREDIT_CARD";
    case "PAYPAL":
      return "WALLET";
    case "BANK_TRANSFER":
      return "ALL";
    default:
      return "ALL";
  }
}

function splitCustomerName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Client", last: "Objectif TCF" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function isCinetPayConfigured(): boolean {
  const apiKey = process.env.CINETPAY_API_KEY?.trim();
  const siteId = process.env.CINETPAY_SITE_ID?.trim();
  if (!apiKey || apiKey === "..." || apiKey.length < 8) return false;
  if (!siteId || siteId === "..." || siteId.length < 1) return false;
  return true;
}

export async function createCinetPayCheckout(
  params: ProviderChargeParams
): Promise<{ checkoutUrl: string; externalId?: string }> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) {
    throw new Error("CINETPAY_NOT_CONFIGURED");
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const notifyUrl = `${baseUrl}/api/paiement/webhook/cinetpay`;
  const { first, last } = splitCustomerName(params.customerName);
  const amount = Math.max(1, Math.round(params.amount));

  const body: Record<string, string | number> = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.providerReference,
    amount,
    currency: params.currency,
    description: params.description.slice(0, 200),
    notify_url: notifyUrl,
    return_url: params.redirectUrl,
    channels: cinetPayChannelsForMethod(params.method),
    customer_name: first.slice(0, 50),
    customer_surname: last.slice(0, 50),
    customer_email: params.customerEmail,
    metadata: JSON.stringify({ payment_id: params.paymentId }),
  };

  if (params.phoneNumber?.trim()) {
    body.customer_phone_number = params.phoneNumber.replace(/\s/g, "").slice(0, 20);
  }

  const response = await fetch(`${CINETPAY_API}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    description?: string;
    data?: { payment_url?: string; payment_token?: string };
  };

  const paymentUrl = payload.data?.payment_url;
  if (!response.ok || !paymentUrl) {
    const detail =
      payload.message ?? payload.description ?? "Initialisation CinetPay échouée";
    throw new Error(detail);
  }

  return {
    checkoutUrl: paymentUrl,
    externalId: payload.data?.payment_token,
  };
}

export async function verifyCinetPayTransaction(
  transactionId: string
): Promise<{ status: "SUCCEEDED" | "FAILED"; txRef: string; externalId?: string }> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  if (!apiKey || !siteId) {
    throw new Error("CINETPAY_NOT_CONFIGURED");
  }

  const response = await fetch(`${CINETPAY_API}/payment/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }),
  });

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    data?: {
      status?: string;
      payment_method?: string;
      operator_id?: string;
      payment_token?: string;
    };
  };

  if (!response.ok || payload.code !== "00") {
    return { status: "FAILED", txRef: transactionId };
  }

  const accepted = payload.data?.status?.toUpperCase() === "ACCEPTED";
  return {
    status: accepted ? "SUCCEEDED" : "FAILED",
    txRef: transactionId,
    externalId: payload.data?.operator_id ?? payload.data?.payment_token,
  };
}
