import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { refundPaymentForAdmin } from "@/lib/payments/service";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();

    if (body?.action !== "refund") {
      return validationErrorResponse({ action: ["Action non supportée"] });
    }

    const payment = await refundPaymentForAdmin(id, admin.userId, body.reason);

    if (!payment) return notFoundResponse("Paiement");

    return successResponse(payment, "Paiement remboursé");
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_NOT_REFUNDABLE") {
      return validationErrorResponse({
        status: ["Ce paiement ne peut pas être remboursé"],
      });
    }
    if (error instanceof Error) {
      const providerErrors = [
        "STRIPE_NOT_CONFIGURED",
        "STRIPE_MISSING_SESSION_ID",
        "PAWAPAY_NOT_CONFIGURED",
        "PAWAPAY_MISSING_DEPOSIT_ID",
        "FLUTTERWAVE_MISSING_TRANSACTION_ID",
        "PAYPAL_REFUND_NOT_IMPLEMENTED",
        "PROVIDER_REFUND_UNSUPPORTED",
      ];
      if (providerErrors.includes(error.message)) {
        return validationErrorResponse({
          provider: [error.message],
        });
      }
      if (error.message.includes("Remboursement") || error.message.includes("refund")) {
        return validationErrorResponse({
          provider: [error.message],
        });
      }
    }
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
