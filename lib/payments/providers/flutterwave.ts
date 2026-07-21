import type { PaymentMethod } from "@prisma/client";
import type { ProviderChargeParams } from "../types";

const FLW_BASE = "https://api.flutterwave.com/v3";

function flutterwaveOptionsForMethod(method: PaymentMethod): string {
  switch (method) {
    case "CARD":
      return "card";
    case "GOOGLE_PAY":
      return "googlepay,card";
    case "MOBILE_MONEY":
      return "mobilemoney,mobilemoneyfranco";
    case "MOBILE_MONEY_MTN":
      return "mobilemoney";
    case "MOBILE_MONEY_ORANGE":
      return "mobilemoneyfranco";
    case "MOBILE_MONEY_AIRTEL":
      return "mobilemoney";
    case "MOBILE_MONEY_WAVE":
      return "mobilemoney";
    case "MOBILE_MONEY_MOOV":
      return "mobilemoneyfranco";
    case "PAYPAL":
      return "paypal";
    case "BANK_TRANSFER":
      return "banktransfer,ussd";
    default:
      return "card,googlepay,mobilemoney,mobilemoneyfranco,paypal,banktransfer,ussd";
  }
}

export function isFlutterwaveConfigured(): boolean {
  const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
  if (!key || key === "..." || key.length < 12) return false;
  return true;
}

export async function createFlutterwaveCheckout(
  params: ProviderChargeParams
): Promise<{ checkoutUrl: string; externalId?: string }> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("FLUTTERWAVE_NOT_CONFIGURED");
  }

  const body: Record<string, unknown> = {
    tx_ref: params.providerReference,
    amount: params.amount,
    currency: params.currency,
    redirect_url: params.redirectUrl,
    payment_options: flutterwaveOptionsForMethod(params.method),
    customer: {
      email: params.customerEmail,
      name: params.customerName,
      ...(params.phoneNumber ? { phonenumber: params.phoneNumber } : {}),
    },
    customizations: {
      title: "Objectif TCF",
      description: params.description,
      logo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/logo.png`,
    },
    meta: {
      payment_id: params.paymentId,
    },
  };

  const response = await fetch(`${FLW_BASE}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as {
    status: string;
    message?: string;
    data?: { link?: string; id?: number };
  };

  if (!response.ok || payload.status !== "success" || !payload.data?.link) {
    throw new Error(payload.message ?? "Flutterwave checkout failed");
  }

  return {
    checkoutUrl: payload.data.link,
    externalId: payload.data.id ? String(payload.data.id) : undefined,
  };
}

export async function verifyFlutterwaveTransaction(
  transactionId: string
): Promise<{ status: "SUCCEEDED" | "FAILED"; txRef: string }> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("FLUTTERWAVE_NOT_CONFIGURED");
  }

  const response = await fetch(
    `${FLW_BASE}/transactions/${transactionId}/verify`,
    {
      headers: { Authorization: `Bearer ${secretKey}` },
    }
  );

  const payload = (await response.json()) as {
    status: string;
    data?: { status?: string; tx_ref?: string };
  };

  if (!response.ok || payload.status !== "success") {
    throw new Error("Flutterwave verification failed");
  }

  const txStatus = payload.data?.status?.toLowerCase();
  return {
    status: txStatus === "successful" ? "SUCCEEDED" : "FAILED",
    txRef: payload.data?.tx_ref ?? "",
  };
}

export function verifyFlutterwaveWebhookSignature(
  signature: string | null,
  rawBody: string
): boolean {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  if (!secretHash || !signature) return false;
  return signature === secretHash;
}

/** Remboursement Flutterwave (complet ou partiel). */
export async function refundFlutterwaveTransaction(
  transactionId: string,
  amount?: number,
  reason?: string
): Promise<{ refundReference: string; status: string }> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("FLUTTERWAVE_NOT_CONFIGURED");
  }

  const body: Record<string, string> = {};
  if (amount != null && amount > 0) {
    body.amount = String(amount);
  }
  if (reason) {
    body.comments = reason.slice(0, 500);
  }

  const response = await fetch(
    `${FLW_BASE}/transactions/${transactionId}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const payload = (await response.json()) as {
    status: string;
    message?: string;
    data?: { id?: number; status?: string; flw_ref?: string };
  };

  if (!response.ok || payload.status !== "success") {
    throw new Error(payload.message ?? "Remboursement Flutterwave échoué");
  }

  return {
    refundReference:
      payload.data?.flw_ref ??
      (payload.data?.id != null ? String(payload.data.id) : transactionId),
    status: payload.data?.status ?? "completed",
  };
}
