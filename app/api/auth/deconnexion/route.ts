import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";
import { clearAuthCookies, getRefreshToken } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      // Revoke session
      await prisma.session
        .updateMany({
          where: { refreshToken },
          data: { isRevoked: true },
        })
        .catch(console.error);
    }

    await clearAuthCookies();

    return successResponse(null, "Déconnexion réussie");
  } catch (error) {
    return serverErrorResponse(error);
  }
}
