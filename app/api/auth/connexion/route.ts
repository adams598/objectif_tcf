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
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse("Données invalides", 422);
    }

    const { email, password } = parsed.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        accounts: {
          where: { provider: "credentials" },
        },
      },
    });

    if (!user || !user.isActive) {
      return errorResponse("Email ou mot de passe incorrect", 401);
    }

    // Check password
    const credentialsAccount = user.accounts[0];
    if (!credentialsAccount?.accessToken) {
      return errorResponse(
        "Ce compte utilise une connexion sociale (Google). Connectez-vous via Google.",
        401
      );
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      credentialsAccount.accessToken
    );

    if (!isPasswordValid) {
      return errorResponse("Email ou mot de passe incorrect", 401);
    }

    if (!user.emailVerified) {
      return errorResponse(
        "Veuillez vérifier votre email avant de vous connecter.",
        403
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const sessionId = randomUUID();

    await prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshToken,
        userAgent: request.headers.get("user-agent") ?? undefined,
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] ??
          request.headers.get("x-real-ip") ??
          undefined,
        expiresAt,
      },
    });

    // Set cookies
    await setAuthCookies(accessToken, refreshToken);

    // Audit log
    void prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
      },
    }).catch(console.error);

    return successResponse(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
      "Connexion réussie"
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
