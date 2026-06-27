import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

const requestSchema = z.object({
  email: z.string().email(),
  action: z.literal("request"),
});

const resetSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
  action: z.literal("reset"),
});

const bodySchema = z.union([requestSchema, resetSchema]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Données invalides", 422);
    }

    if (parsed.data.action === "request") {
      // Request password reset
      const { email } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });

      // Always return success to prevent user enumeration
      if (user) {
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

        await prisma.passwordReset.create({
          data: { userId: user.id, token, expiresAt },
        });

        void sendResetEmail(email, user.name, token).catch(console.error);
      }

      return successResponse(null, "Si l'email existe, un lien de réinitialisation a été envoyé.");
    }

    // Reset password
    const { token, password } = parsed.data;

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return errorResponse("Lien de réinitialisation invalide ou expiré", 400);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12");
    const hashedPassword = await bcrypt.hash(password, rounds);

    await prisma.$transaction([
      // Update credentials account
      prisma.account.updateMany({
        where: { userId: reset.userId, provider: "credentials" },
        data: { accessToken: hashedPassword },
      }),
      // Mark reset as used
      prisma.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all sessions
      prisma.session.updateMany({
        where: { userId: reset.userId },
        data: { isRevoked: true },
      }),
    ]);

    return successResponse(null, "Mot de passe réinitialisé avec succès");
  } catch (error) {
    return serverErrorResponse(error);
  }
}

async function sendResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reinitialisation-mot-de-passe?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Reset URL for ${email}: ${resetUrl}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@objectifcanada.ca",
    to: email,
    subject: "Réinitialisez votre mot de passe — Objectif Canada",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f378a;">Réinitialisation de votre mot de passe</h1>
        <p>Bonjour ${name},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p>
        <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f378a, #6750a4); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          Réinitialiser mon mot de passe
        </a>
        <p style="color: #7a7582; font-size: 14px; margin-top: 24px;">
          Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `,
  });
}
