import { resolveAppUrl } from "@/lib/env/app-url";

function envStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key === "..." || key.length < 12) return false;
  return true;
}

function envPawaPayConfigured(): boolean {
  const token = process.env.PAWAPAY_API_TOKEN?.trim();
  if (!token || token === "..." || token.length < 16) return false;
  return true;
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

function isPlaceholder(value: string | undefined, markers: string[]): boolean {
  if (!value?.trim()) return true;
  const lower = value.toLowerCase();
  return markers.some((m) => lower.includes(m));
}

export interface ProductionValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Vérifie que l'app peut tourner en production (paiements auto + admin). */
export function validateProductionEnv(): ProductionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const appUrl = resolveAppUrl();
  if (
    !appUrl ||
    appUrl.includes("localhost") ||
    appUrl.startsWith("http://")
  ) {
    errors.push(
      "NEXT_PUBLIC_APP_URL doit être une URL HTTPS publique (ex. https://objectiftcf.com)"
    );
  }

  if (
    isPlaceholder(process.env.JWT_SECRET, [
      "your-super-secret",
      "fallback-secret",
      "changez",
    ])
  ) {
    errors.push("JWT_SECRET : définir un secret aléatoire d'au moins 32 caractères");
  }

  if (
    isPlaceholder(process.env.JWT_REFRESH_SECRET, [
      "your-super-secret",
      "fallback-refresh",
      "changez",
    ])
  ) {
    errors.push(
      "JWT_REFRESH_SECRET : définir un secret différent de JWT_SECRET (≥ 32 caractères)"
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    errors.push("DATABASE_URL manquant (PostgreSQL / Neon)");
  }

  if (process.env.PAYMENTS_MOCK_MODE === "true") {
    errors.push("PAYMENTS_MOCK_MODE=true interdit en production");
  }

  const stripe = envStripeConfigured();
  const pawapay = envPawaPayConfigured();

  if (!stripe && !pawapay) {
    errors.push(
      "Configurer au moins Stripe (Europe) ou pawaPay (Afrique) pour les paiements automatiques"
    );
  }

  if (stripe && !process.env.STRIPE_WEBHOOK_SECRET?.trim()) {
    errors.push(
      "STRIPE_WEBHOOK_SECRET manquant — webhooks Stripe requis pour activer les abonnements"
    );
  }

  if (pawapay) {
    const env = process.env.PAWAPAY_ENV?.toLowerCase();
    if (env !== "production" && env !== "live") {
      warnings.push(
        "PAWAPAY_ENV n'est pas 'production' — vous encaissez peut-être encore en sandbox"
      );
    }
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    warnings.push("RESEND_API_KEY absent — emails transactionnels désactivés");
  }

  if (
    isPlaceholder(process.env.RESEND_FROM_EMAIL, [
      "onboarding@resend.dev",
      "votredomaine",
    ])
  ) {
    warnings.push(
      "RESEND_FROM_EMAIL : vérifier un domaine d'envoi pour la production"
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    warnings.push(
      "BLOB_READ_WRITE_TOKEN absent — uploads médias (admin, avatars, EO) nécessitent Vercel Blob en production"
    );
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function getPublicAppUrl(): string {
  return resolveAppUrl();
}
