import { resolveAppUrl } from "@/lib/env/app-url";

function getAppBaseUrl(): string {
  return resolveAppUrl();
}

export type PawaPayEnvironment = "sandbox" | "production";

export function getPawaPayEnvironment(): PawaPayEnvironment {
  const env = process.env.PAWAPAY_ENV?.trim().toLowerCase();
  if (env === "production" || env === "live") return "production";
  return "sandbox";
}

/** @see https://docs.pawapay.io/v2/docs/how_to_start */
export function getPawaPayApiBaseUrl(): string {
  return getPawaPayEnvironment() === "production"
    ? "https://api.pawapay.io"
    : "https://api.sandbox.pawapay.io";
}

export function getPawaPayDashboardUrl(): string {
  return getPawaPayEnvironment() === "production"
    ? "https://dashboard.pawapay.io"
    : "https://dashboard.sandbox.pawapay.io";
}

/** URL à enregistrer dans Developers → Callback URLs (même URL pour tous les flux). */
export function getPawaPayCallbackUrl(): string {
  const base = process.env.PAWAPAY_CALLBACK_URL?.trim() || getAppBaseUrl();
  return `${base.replace(/\/$/, "")}/api/paiement/webhook/pawapay`;
}

export function getPawaPayApiToken(): string | null {
  const token = process.env.PAWAPAY_API_TOKEN?.trim();
  if (!token || token === "..." || token.length < 16) return null;
  return token;
}

export function isPawaPayConfigured(): boolean {
  return getPawaPayApiToken() != null;
}
