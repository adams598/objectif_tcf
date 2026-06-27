import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import {
  successResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/lib/auth/jwt";
import { getRefreshToken, setAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return unauthorizedResponse();

    // Verify refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // Check session validity
    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return unauthorizedResponse();
    }

    // Generate new tokens
    const tokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name,
    };

    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ]);

    // Update session with new refresh token
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await setAuthCookies(newAccessToken, newRefreshToken);

    return successResponse({ refreshed: true });
  } catch {
    return unauthorizedResponse();
  }
}
