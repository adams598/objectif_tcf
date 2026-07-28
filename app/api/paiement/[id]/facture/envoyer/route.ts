import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { sendInvoiceEmailForPayment } from "@/lib/invoices/issue-invoice";
import { getPaymentForUser } from "@/lib/payments/service";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const payment = await getPaymentForUser(id, user.userId);
    if (!payment) {
      return notFoundResponse("Paiement");
    }

    if (payment.status !== "SUCCEEDED") {
      return errorResponse("Le paiement n'est pas encore confirmé");
    }

    const result = await sendInvoiceEmailForPayment(id, { force: true });
    if (!result.ok) {
      return errorResponse(result.error ?? "Envoi impossible");
    }

    return successResponse({
      sent: true,
      devMode: result.devMode ?? false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
