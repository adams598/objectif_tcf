import { NextRequest } from "next/server";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
  markPaymentRefundedByProvider,
} from "@/lib/payments/service";
import { verifyFlutterwaveWebhookSignature } from "@/lib/payments/providers/flutterwave";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

interface FlutterwaveWebhookPayload {
  event?: string;
  data?: {
    status?: string;
    tx_ref?: string;
    id?: number;
    flw_ref?: string;
  };
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("verif-hash");

  if (!verifyFlutterwaveWebhookSignature(signature, rawBody)) {
    return errorResponse("Signature webhook invalide", 401);
  }

  let payload: FlutterwaveWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as FlutterwaveWebhookPayload;
  } catch {
    return errorResponse("Payload invalide", 400);
  }

  const txRef = payload.data?.tx_ref;
  if (!txRef) {
    return successResponse({ received: true });
  }

  const status = payload.data?.status?.toLowerCase();
  const externalId = payload.data?.id ? String(payload.data.id) : undefined;

  if (payload.event === "charge.completed" && status === "successful") {
    await finalizeSuccessfulPayment(txRef, externalId);
  } else if (payload.event === "charge.completed" && (status === "failed" || status === "cancelled")) {
    await markPaymentFailed(txRef, `Flutterwave: ${status}`);
  } else if (status === "successful") {
    await finalizeSuccessfulPayment(txRef, externalId);
  } else if (status === "failed" || status === "cancelled") {
    await markPaymentFailed(txRef, `Flutterwave: ${status}`);
  }

  if (
    payload.event === "refund.completed" ||
    payload.data?.status?.toLowerCase() === "refunded"
  ) {
    await markPaymentRefundedByProvider(txRef, externalId);
  }

  return successResponse({ received: true });
}
