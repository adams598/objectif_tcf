import { getAccessToken, getRefreshToken } from "./cookies";
import { verifyAccessToken, verifyRefreshToken, type JWTUserPayload } from "./jwt";

export async function getCurrentUser(): Promise<JWTUserPayload | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    return await verifyAccessToken(accessToken);
  } catch {
    // Token may be expired, try refresh
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;

      return await verifyRefreshToken(refreshToken);
    } catch {
      return null;
    }
  }
}

export async function requireAuth(): Promise<JWTUserPayload> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(
  ...roles: string[]
): Promise<JWTUserPayload> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
