import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { randomUUID } from "crypto";

// POST: verify token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = z.object({ token: z.string() }).parse(body);

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification || verification.usedAt) {
      return errorResponse("Lien de vérification invalide ou déjà utilisé", 400);
    }

    if (verification.expiresAt < new Date()) {
      return errorResponse("Lien de vérification expiré", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return successResponse(null, "Email vérifié avec succès");
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// PUT: resend verification email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return errorResponse("Utilisateur introuvable", 404);
    if (user.emailVerified) return errorResponse("Email déjà vérifié", 400);

    // Create new verification token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.create({
      data: { userId: user.id, token, expiresAt },
    });

    return successResponse(null, "Email de vérification renvoyé");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
