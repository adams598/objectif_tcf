import { NextRequest } from "next/server";
import { z } from "zod";
import { getResendClient } from "@/lib/email/resend-client";
import {
  successResponse,
  validationErrorResponse,
  serverErrorResponse,
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

    const toEmail =
      process.env.CONTACT_EMAIL?.trim() ??
      process.env.RESEND_FROM_EMAIL?.trim() ??
      "onboarding@resend.dev";

    const fromName = process.env.RESEND_FROM_NAME?.trim() ?? "Objectif TCF";
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() ?? "onboarding@resend.dev";

    try {
      const resend = getResendClient();
      await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: toEmail,
        replyTo: parsed.data.email,
        subject: `[Contact] Message de ${parsed.data.name}`,
        text: [
          `Nom : ${parsed.data.name}`,
          `Email : ${parsed.data.email}`,
          parsed.data.phone ? `Téléphone : ${parsed.data.phone}` : null,
          "",
          parsed.data.message,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (emailError) {
      if (!(emailError instanceof Error && emailError.message.includes("RESEND"))) {
        throw emailError;
      }
      console.info("[contact] Resend non configuré, message loggé:", parsed.data);
    }

    return successResponse({ received: true });
  } catch (error) {
    return serverErrorResponse(error);
  }
}