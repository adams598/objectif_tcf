import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import {
  createdResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email/send-verification-email";

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Données invalides", 422);
    }

    const { firstName, lastName, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Un compte avec cet email existe déjà", 409);
    }

    // Hash password
    const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12");
    const hashedPassword = await bcrypt.hash(password, rounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        firstName,
        lastName,
      },
    });

    // Create account with password
    await prisma.account.create({
      data: {
        userId: user.id,
        provider: "credentials",
        providerAccountId: user.id,
        accessToken: hashedPassword, // Store hashed password in accessToken for credentials
      },
    });

    // Create email verification token
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Create default settings
    await prisma.userSettings.create({
      data: { userId: user.id },
    });

    const sendResult = await sendVerificationEmail(
      user.email,
      user.name,
      verificationToken
    );
    if (!sendResult.ok) {
      console.error("[Inscription] Email verification failed:", sendResult.error);
    }

    return createdResponse(
      {
        userId: user.id,
        email: user.email,
        emailSent: sendResult.ok,
      },
      sendResult.ok
        ? "Compte créé avec succès. Vérifiez votre email."
        : "Compte créé. L'envoi de l'email a échoué — utilisez « Renvoyer l'email » sur la page de vérification."
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
