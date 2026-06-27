import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-min-32-chars-here"
);

const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? "fallback-refresh-secret-min-32-chars"
);

const ACCESS_TOKEN_EXPIRES = process.env.JWT_EXPIRES_IN ?? "15m";
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export interface JWTUserPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function signAccessToken(payload: Omit<JWTUserPayload, "iat" | "exp">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES)
    .sign(JWT_SECRET);
}

export async function signRefreshToken(payload: Omit<JWTUserPayload, "iat" | "exp">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<JWTUserPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as JWTUserPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTUserPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET);
  return payload as JWTUserPayload;
}

export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${duration}`);

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 0);
}
