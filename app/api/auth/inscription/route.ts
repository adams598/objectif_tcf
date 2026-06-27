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

    // Send verification email (non-blocking)
    void sendVerificationEmail(user.email, user.name, verificationToken).catch(
      console.error
    );

    return createdResponse(
      { userId: user.id, email: user.email },
      "Compte créé avec succès. Vérifiez votre email."
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verification-email?token=${token}`;

  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification URL for ${email}: ${verificationUrl}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@objectifcanada.ca",
    to: email,
    subject: "Vérifiez votre email — Objectif Canada",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #4f378a;">Bienvenue sur Objectif Canada, ${name} !</h1>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
        <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #4f378a, #6750a4); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
          Vérifier mon email
        </a>
        <p style="color: #7a7582; font-size: 14px; margin-top: 24px;">
          Ce lien expire dans 24 heures.
        </p>
      </div>
    `,
  });
}
