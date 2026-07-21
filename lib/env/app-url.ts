function normalizeUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/** URL publique de l'app (emails, webhooks, métadonnées). */
export function resolveAppUrl(): string {
  const explicit =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "";

  if (explicit) {
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

  return "http://localhost:3000";
}

/** URI de callback OAuth à partir de la requête HTTP (évite les mismatches Vercel). */
export function getGoogleCallbackUriFromOrigin(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/auth/google/callback`;
}
