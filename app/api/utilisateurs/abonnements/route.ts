import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  cancelSubscriptionAtPeriodEnd,
  listActiveSubscriptionsForUser,
} from "@/lib/subscriptions/manage";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/utils/api-response";

const cancelSchema = z.object({
  examType: z.enum(["TCF_CANADA", "TEF_CANADA", "IELTS"]),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const subscriptions = await listActiveSubscriptionsForUser(user.userId);
    return successResponse({
      subscriptions: subscriptions.map((sub) => ({
        ...sub,
        currentPeriodStart: sub.currentPeriodStart.toISOString(),
        currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = cancelSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await cancelSubscriptionAtPeriodEnd(
      user.userId,
      parsed.data.examType
    );

    if (!result) {
      return notFoundResponse("Abonnement actif");
    }

    return successResponse(
      {
        examType: result.subscription.examType,
        plan: result.subscription.plan,
        autoRenew: result.subscription.autoRenew,
        cancelAtPeriodEnd: result.subscription.cancelAtPeriodEnd,
        currentPeriodEnd: result.effectiveUntil,
        noRefund: true,
      },
      result.message
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "STRIPE_CANCEL_FAILED") {
      return errorResponse(
        "Impossible d'annuler le renouvellement auprès du prestataire de paiement. Réessayez.",
        502
      );
    }
    return serverErrorResponse(error);
  }
}
