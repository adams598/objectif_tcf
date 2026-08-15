import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { resolveAppUrl } from "@/lib/env/app-url";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
} from "@/lib/payments/service";
import { verifyPaycardPayment } from "@/lib/payments/providers/paycard";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

/**
 * Callback Paycard — GET obligatoire (redirect_with_get).
 * Query attendue : paycard-operation-reference=<ref>
 * Réf. : https://github.com/bmsanoussy/paycard-laravel
 */
async function handlePaycardCallback(req: NextRequest) {
  const reference =
    req.nextUrl.searchParams.get("paycard-operation-reference") ??
    req.nextUrl.searchParams.get("reference") ??
    req.nextUrl.searchParams.get("operation_reference");

  if (!reference) {
    return successResponse({ received: true });
  }

  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: { id: true, status: true },
  });

  try {
    const verified = await verifyPaycardPayment(reference);

    if (verified.status === "SUCCEEDED") {
      await finalizeSuccessfulPayment(verified.txRef, verified.externalId);
    } else if (verified.status === "FAILED") {
      await markPaymentFailed(
        reference,
        verified.rawStatus
          ? `Paycard: ${verified.rawStatus}`
          : "Paiement Paycard échoué"
      );
    }
  } catch (error) {
    console.error("[Paycard webhook]", error);
    // On redirige quand même l'utilisateur vers la page succès pour poller
  }

  if (payment?.id) {
    const base = resolveAppUrl();
    return NextResponse.redirect(
      `${base}/offres/paiement/succes?paymentId=${payment.id}`
    );
  }

  return successResponse({ received: true, reference });
}

export async function GET(req: NextRequest) {
  return handlePaycardCallback(req);
}

/** Certains flux peuvent notifier en POST — on accepte aussi. */
export async function POST(req: NextRequest) {
  try {
    return handlePaycardCallback(req);
  } catch (error) {
    console.error("[Paycard webhook POST]", error);
    return errorResponse("Traitement Paycard échoué", 500);
  }
}
