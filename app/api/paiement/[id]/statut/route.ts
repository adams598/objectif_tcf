import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  finalizeSuccessfulPayment,
  getPaymentForUser,
  markPaymentFailed,
  toPaymentSessionDetails,
} from "@/lib/payments/service";
import { verifyPawaPayCheckout } from "@/lib/payments/providers/pawapay";
import { verifyFlutterwaveTransaction } from "@/lib/payments/providers/flutterwave";
import { retrieveStripeSession } from "@/lib/payments/providers/stripe";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    let payment = await getPaymentForUser(id, user.userId);
    if (!payment) {
      return notFoundResponse("Paiement");
    }

    if (payment.status === "PROCESSING") {
      const transactionId = searchParams.get("transaction_id");
      const sessionId = searchParams.get("session_id");
      const flwStatus = searchParams.get("status");

      try {
        if (payment.provider === "PAWAPAY" && payment.providerReference) {
          const verified = await verifyPawaPayCheckout(payment.providerReference);
          if (verified.status === "SUCCEEDED" && verified.txRef) {
            payment =
              (await finalizeSuccessfulPayment(
                verified.txRef,
                verified.depositId
              )) ?? payment;
          } else if (verified.status === "FAILED") {
            await markPaymentFailed(
              payment.providerReference,
              "Paiement pawaPay non confirmé"
            );
            payment = (await getPaymentForUser(id, user.userId))!;
          }
        } else if (
          transactionId &&
          payment.provider === "FLUTTERWAVE" &&
          flwStatus === "successful"
        ) {
          const verified = await verifyFlutterwaveTransaction(transactionId);
          if (verified.status === "SUCCEEDED" && verified.txRef) {
            payment =
              (await finalizeSuccessfulPayment(verified.txRef, transactionId)) ??
              payment;
          } else {
            await markPaymentFailed(payment.providerReference!, "Paiement non confirmé");
            payment = (await getPaymentForUser(id, user.userId))!;
          }
        } else if (sessionId && payment.provider === "STRIPE") {
          const verified = await retrieveStripeSession(sessionId);
          if (verified.status === "SUCCEEDED" && verified.txRef) {
            payment =
              (await finalizeSuccessfulPayment(verified.txRef, sessionId)) ??
              payment;
          }
        }
      } catch (verifyError) {
        console.error("[Payment verify]", verifyError);
      }
    }

    if (!payment) {
      payment = (await prisma.payment.findFirst({
        where: { id, userId: user.userId },
      }))!;
    }

    return successResponse({
      payment: toPaymentSessionDetails(payment),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
