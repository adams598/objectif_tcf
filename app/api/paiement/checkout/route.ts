import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import {
  createPaymentSession,
  toPaymentSessionDetails,
} from "@/lib/payments/service";
import { buildPaymentPagePath } from "@/lib/pricing/checkout";
import {
  MAX_PREPARATION_DAYS,
  MIN_PREPARATION_DAYS,
} from "@/lib/pricing/constants";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

const checkoutSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("custom"),
    examTab: z.enum(["tcf", "tef", "ielts"]),
    days: z.number().int().min(MIN_PREPARATION_DAYS).max(MAX_PREPARATION_DAYS),
  }),
  z.object({
    type: z.literal("offer"),
    offerId: z.string().uuid(),
  }),
]);

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const payment = await createPaymentSession(user.userId, parsed.data);

    return createdResponse(
      {
        paymentId: payment.id,
        redirectUrl: buildPaymentPagePath(payment.id),
        payment: toPaymentSessionDetails(payment),
      },
      "Session de paiement créée."
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return notFoundResponse("Offre");
    }
    return serverErrorResponse(error);
  }
}
