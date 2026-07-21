import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { splitDisplayName } from "@/lib/user/profile";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        onboardingCompleted: true,
        accounts: {
          select: { provider: true },
        },
      },
    });

    if (!dbUser) {
      return unauthorizedResponse();
    }

    const hasCredentials = dbUser.accounts.some(
      (account) => account.provider === "credentials"
    );
    const hasGoogle = dbUser.accounts.some(
      (account) => account.provider === "google"
    );

    const fromName = splitDisplayName(dbUser.name);

    return successResponse({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      displayFirstName: dbUser.firstName ?? fromName.firstName,
      displayLastName: dbUser.lastName ?? fromName.lastName,
      avatarUrl: dbUser.avatarUrl,
      role: dbUser.role,
      emailVerified: dbUser.emailVerified,
      onboardingCompleted: dbUser.onboardingCompleted,
      hasCredentials,
      hasGoogle,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
