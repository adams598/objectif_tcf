import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import {
  getPaymentForUser,
  simulateMockPaymentSuccess,
} from "@/lib/payments/service";
import { isMockPaymentsEnabled } from "@/lib/payments/providers/mock";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
} from "@/lib/utils/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isMockPaymentsEnabled()) {
      return forbiddenResponse();
    }

    const user = await requireAuth();
    const { id } = await params;

    const payment = await getPaymentForUser(id, user.userId);
    if (!payment) {
      return notFoundResponse("Paiement");
    }

    const updated = await simulateMockPaymentSuccess(id, user.userId);
    if (!updated) {
      return errorResponse("Simulation impossible.");
    }

    return successResponse(
      { paymentId: updated.id, status: updated.status },
      "Paiement simulé avec succès."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
