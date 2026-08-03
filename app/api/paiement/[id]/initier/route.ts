import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/session";
import { initiatePayment } from "@/lib/payments/service";
import { PawaPayApiError } from "@/lib/payments/providers/pawapay";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/utils/api-response";

const initiateSchema = z.object({
  currency: z.enum(["XAF", "XOF", "USD", "EUR"]),
  method: z.enum([
    "CARD",
    "MOBILE_MONEY",
    "MOBILE_MONEY_MTN",
    "MOBILE_MONEY_ORANGE",
    "MOBILE_MONEY_AIRTEL",
    "MOBILE_MONEY_WAVE",
    "MOBILE_MONEY_MOOV",
    "PAYPAL",
    "GOOGLE_PAY",
    "BANK_TRANSFER",
    "SEPA",
  ]),
  phoneNumber: z.string().min(8).max(20).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = initiateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const phoneRequired = [
      "MOBILE_MONEY",
      "MOBILE_MONEY_MTN",
      "MOBILE_MONEY_ORANGE",
      "MOBILE_MONEY_AIRTEL",
      "MOBILE_MONEY_WAVE",
      "MOBILE_MONEY_MOOV",
    ].includes(parsed.data.method);

    if (phoneRequired && !parsed.data.phoneNumber) {
      return errorResponse("Numéro de téléphone requis pour ce moyen de paiement.");
    }

    const result = await initiatePayment(
      { paymentId: id, ...parsed.data },
      { userId: user.userId, email: user.email, name: user.name }
    );

    return successResponse(result, "Redirection vers le prestataire de paiement.");
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "PAYMENT_NOT_FOUND") {
      return notFoundResponse("Paiement");
    }
    if (error instanceof Error && error.message === "PAYMENT_ALREADY_COMPLETED") {
      return errorResponse("Ce paiement a déjà été effectué.", 409);
    }
    if (error instanceof Error && error.message === "PAYMENT_NOT_PAYABLE") {
      return errorResponse("Ce paiement ne peut plus être initié.", 409);
    }
    if (error instanceof Error && error.message === "NO_PAYMENT_PROVIDER_CONFIGURED") {
      return errorResponse(
        "Aucun prestataire de paiement configuré. Ajoutez vos clés Stripe ou pawaPay.",
        503
      );
    }
    if (error instanceof Error && error.message === "PAWAPAY_NOT_CONFIGURED") {
      return errorResponse(
        "pawaPay n’est pas configuré (PAWAPAY_API_TOKEN manquant sur Vercel).",
        503
      );
    }
    if (error instanceof PawaPayApiError) {
      return errorResponse(error.message, 502);
    }
    return serverErrorResponse(error);
  }
}
