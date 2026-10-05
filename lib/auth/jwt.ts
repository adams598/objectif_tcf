import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL } from "@/lib/auth/durations";

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

const ACCESS_TOKEN_EXPIRES = ACCESS_TOKEN_TTL;
const REFRESH_TOKEN_EXPIRES = REFRESH_TOKEN_TTL;

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

export { parseDuration } from "@/lib/auth/durations";
