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
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset-email";

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

        const sendResult = await sendPasswordResetEmail(
          email,
          user.name,
          token
        );
        if (!sendResult.ok) {
          console.error("[Password reset] Email send failed:", sendResult.error);
        }
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
      // Mot de passe changé par l'utilisateur → plus visible côté admin
      prisma.user.update({
        where: { id: reset.userId },
        data: { adminPasswordEnc: null },
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
