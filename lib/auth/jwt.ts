import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function resolveSecret(
  value: string | undefined,
  envName: string,
  devFallback: string
): Uint8Array {
  const secret = value?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32) {
      throw new Error(`${envName} requis en production (≥ 32 caractères)`);
    }
    if (
      secret.includes("your-super-secret") ||
      secret.includes("fallback-secret")
    ) {
      throw new Error(`${envName} ne doit pas être une valeur par défaut`);
    }
    return new TextEncoder().encode(secret);
  }
  return new TextEncoder().encode(secret ?? devFallback);
}

function getAccessSecret(): Uint8Array {
  return resolveSecret(
    process.env.JWT_SECRET,
    "JWT_SECRET",
    "fallback-secret-min-32-chars-here"
  );
}

function getRefreshSecret(): Uint8Array {
  return resolveSecret(
    process.env.JWT_REFRESH_SECRET,
    "JWT_REFRESH_SECRET",
    "fallback-refresh-secret-min-32-chars"
  );
}

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
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: Omit<JWTUserPayload, "iat" | "exp">) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<JWTUserPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as JWTUserPayload;
}

export async function verifyRefreshToken(token: string): Promise<JWTUserPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
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
