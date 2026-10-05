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

type HeaderSource = { get(name: string): string | null };

export type PublicOriginRequest = {
  nextUrl: URL;
  headers: HeaderSource;
};

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Hôte vu par Node derrière le proxy Hostinger (bind 0.0.0.0), inutilisable pour Google. */
export function isUnusableOAuthHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "0.0.0.0" || host === "::" || host === "[::]") return true;
  if (process.env.NODE_ENV !== "production") return false;
  if (LOOPBACK_HOSTS.has(host)) return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function hostnameOf(host: string): string {
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(1, end);
  }
  return host.split(":")[0] ?? host;
}

function firstUsableHost(values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (!value) continue;
    const host = value.split(",")[0]?.trim();
    if (!host || isUnusableOAuthHost(hostnameOf(host))) continue;
    return host;
  }
  return null;
}

/**
 * Origine publique réelle (domaine du navigateur).
 * Sur Hostinger, `request.nextUrl.origin` vaut `https://0.0.0.0:3000` :
 * Google rejette cette URI (règle OAuth : pas d'adresse IP).
 */
export function resolvePublicOrigin(request: PublicOriginRequest): string {
  const host = firstUsableHost([
    request.headers.get("x-forwarded-host"),
    request.headers.get("host"),
    request.nextUrl.host,
  ]);

  if (!host) return resolveAppUrl();

  const hostname = hostnameOf(host);
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  let proto =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : request.nextUrl.protocol.replace(":", "");

  if (
    process.env.NODE_ENV === "production" &&
    proto === "http" &&
    hostname !== "localhost" &&
    hostname !== "127.0.0.1"
  ) {
    proto = "https";
  }

  return `${proto}://${host}`;
}

export function toPublicUrl(request: PublicOriginRequest, path: string): URL {
  return new URL(path, `${resolvePublicOrigin(request)}/`);
}

/** URI de callback OAuth à partir de la requête HTTP (local ou prod, sans reconfig). */
export function getGoogleCallbackUriFromOrigin(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}

export function getGoogleCallbackUriForCurrentEnv(): string {
  return `${resolveAppUrl()}/api/auth/google/callback`;
}
