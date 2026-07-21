import { NextRequest } from "next/server";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
} from "@/lib/payments/service";
import { verifyCinetPayTransaction } from "@/lib/payments/providers/cinetpay";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

function readTransactionId(req: NextRequest, body: Record<string, string>): string | null {
  const fromQuery = req.nextUrl.searchParams.get("transaction_id");
  if (fromQuery) return fromQuery;
  return body.transaction_id ?? null;
}

async function parseNotifyPayload(
  req: NextRequest
): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await req.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, v != null ? String(v) : ""])
    );
  }

  const form = await req.formData();
  const out: Record<string, string> = {};
  form.forEach((value, key) => {
    out[key] = String(value);
  });
  return out;
}

export async function POST(req: NextRequest) {
  let fields: Record<string, string>;
  try {
    fields = await parseNotifyPayload(req);
  } catch {
    return errorResponse("Payload invalide", 400);
  }

  const transactionId = readTransactionId(req, fields);
  if (!transactionId) {
    return successResponse({ received: true });
  }

  try {
    const verified = await verifyCinetPayTransaction(transactionId);
    if (verified.status === "SUCCEEDED") {
      await finalizeSuccessfulPayment(transactionId, verified.externalId);
    } else {
      const cpmResult = fields.cpm_result;
      if (cpmResult && cpmResult !== "00") {
        await markPaymentFailed(
          transactionId,
          fields.cpm_error_message ?? `CinetPay: ${cpmResult}`
        );
      }
    }
  } catch (error) {
    console.error("[CinetPay webhook]", error);
    return errorResponse("Vérification échouée", 500);
  }

  return successResponse({ received: true });
}

/** Certaines intégrations CinetPay appellent notify_url en GET. */
export async function GET(req: NextRequest) {
  const transactionId = req.nextUrl.searchParams.get("transaction_id");
  if (!transactionId) {
    return successResponse({ received: true });
  }

  try {
    const verified = await verifyCinetPayTransaction(transactionId);
    if (verified.status === "SUCCEEDED") {
      await finalizeSuccessfulPayment(transactionId, verified.externalId);
    }
  } catch (error) {
    console.error("[CinetPay webhook GET]", error);
    return errorResponse("Vérification échouée", 500);
  }

  return successResponse({ received: true });
}
