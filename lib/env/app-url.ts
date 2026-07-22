import { isLocalDevelopment, isVercelRuntime } from "@/lib/env/runtime";

function normalizeUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

const LOCAL_DEFAULT = "http://localhost:3000";

/**
 * URL publique de l'app (emails, webhooks, métadonnées).
 * - Local : `.env.local` → localhost (prioritaire sur toute URL prod copiée par erreur).
 * - Vercel : variables du dashboard, sinon URL auto Vercel.
 */
export function resolveAppUrl(): string {
  if (isLocalDevelopment()) {
    const local =
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      LOCAL_DEFAULT;
    return normalizeUrl(local);
  }

  if (isVercelRuntime()) {
    const explicit =
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "";

    if (explicit && !explicit.includes("localhost")) {
      return normalizeUrl(explicit);
    }

    const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (vercelProduction) {
      return normalizeUrl(vercelProduction);
    }

    const vercelUrl = process.env.VERCEL_URL?.trim();
    if (vercelUrl) {
      return normalizeUrl(vercelUrl);
    }
  }

  const fallback =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    LOCAL_DEFAULT;

  return normalizeUrl(fallback);
}

/** URI de callback OAuth à partir de la requête HTTP (local ou prod, sans reconfig). */
export function getGoogleCallbackUriFromOrigin(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function getGoogleCallbackUriForCurrentEnv(): string {
  return `${resolveAppUrl()}/api/auth/google/callback`;
}
