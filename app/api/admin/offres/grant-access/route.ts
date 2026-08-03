import { NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { grantOfferAccessByEmails } from "@/lib/subscriptions/grant-offer-access";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  errorResponse,
} from "@/lib/utils/api-response";

const schema = z.object({
  offerId: z.string().uuid(),
  emails: z
    .array(z.string().email("Adresse email invalide"))
    .min(1, "Ajoutez au moins une adresse email")
    .max(50, "Maximum 50 adresses par envoi"),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = schema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await grantOfferAccessByEmails({
      emails: parsed.data.emails,
      offerId: parsed.data.offerId,
      admin: {
        userId: admin.userId,
        name: admin.name,
        email: admin.email,
      },
    });

    const granted = result.results.filter((r) => r.status === "granted").length;
    const failed = result.results.length - granted;

    return successResponse(
      result,
      failed === 0
        ? `Accès accordé à ${granted} destinataire${granted > 1 ? "s" : ""} pour « ${result.offerName} » (${result.days} jours).`
        : `Accès accordé à ${granted}/${result.results.length} destinataires (${failed} échec${failed > 1 ? "s" : ""}).`
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return notFoundResponse("Offre");
    }
    if (error instanceof Error && error.message === "OFFER_INVALID_DAYS") {
      return errorResponse("Cette offre n'a pas de durée valide.", 422);
    }
    return serverErrorResponse(error);
  }
}
