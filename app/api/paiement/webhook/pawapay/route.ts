import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  finalizeSuccessfulPayment,
  markPaymentFailed,
} from "@/lib/payments/service";
import { parsePawaPayCallback, verifyPawaPayCheckout } from "@/lib/payments/providers/pawapay";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

/**
 * Callback pawaPay (checkout + deposit).
 * Configurer la même URL pour tous les flux dans le dashboard :
 * Developers → Callback URLs
 * @see https://docs.pawapay.io/dashboard/other/system_conf/callback_urls
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return errorResponse("Payload invalide", 400);
  }

  const parsed = parsePawaPayCallback(body);
  const status = parsed.status?.toUpperCase();

  let providerReference = parsed.checkoutId;

  if (!providerReference && parsed.paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { id: parsed.paymentId },
      select: { providerReference: true },
    });
    providerReference = payment?.providerReference ?? undefined;
  }

  if (!providerReference && parsed.depositId) {
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { externalId: parsed.depositId },
          { providerReference: parsed.depositId },
        ],
      },
      select: { providerReference: true },
    });
    providerReference = payment?.providerReference ?? undefined;
  }

  if (!providerReference) {
    return successResponse({ received: true, ignored: true });
  }

  const externalId = parsed.depositId;

  try {
    if (status === "COMPLETED") {
      const verified = await verifyPawaPayCheckout(providerReference);
      if (verified.status === "SUCCEEDED") {
        await finalizeSuccessfulPayment(
          providerReference,
          verified.depositId ?? externalId
        );
      }
    } else if (
      status === "FAILED" ||
      status === "EXPIRED" ||
      status === "CANCELLED"
    ) {
      await markPaymentFailed(providerReference, `pawaPay: ${status}`);
    }
  } catch (error) {
    console.error("[pawaPay webhook]", error);
    return errorResponse("Traitement échoué", 500);
  }

  return successResponse({ received: true });
}
