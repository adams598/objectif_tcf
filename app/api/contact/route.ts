import { NextRequest } from "next/server";
import { z } from "zod";
import { sendContactMessageEmail } from "@/lib/email/send-contact-email";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
  errorResponse,
} from "@/lib/utils/api-response";

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional().or(z.literal("")),
  message: z.string().min(10).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await sendContactMessageEmail({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      phone: parsed.data.phone?.trim() || undefined,
      message: parsed.data.message.trim(),
    });

    if (!result.ok) {
      console.error("[contact] envoi échoué:", result.error);
      return errorResponse(
        result.error ||
          "Impossible d’envoyer le message pour le moment. Réessayez plus tard.",
        503
      );
    }

    return successResponse({ received: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
