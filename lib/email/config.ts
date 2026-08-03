const DEFAULT_FROM_NAME = "Objectif TCF";
const DEV_FROM_ADDRESS = "onboarding@resend.dev";

import { resolveAppUrl } from "@/lib/env/app-url";

/** Domaines perso — Resend ne peut pas envoyer « From » ces adresses. */
const BLOCKED_FROM_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.fr",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "outlook.fr",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "orange.fr",
  "free.fr",
  "sfr.fr",
  "laposte.net",
  "wanadoo.fr",
]);

export function getAppUrl(): string {
  return resolveAppUrl();
}

function extractEmailAddress(from: string): string {
  const angle = from.match(/<([^>]+)>/);
  return (angle?.[1] ?? from).trim().toLowerCase();
}

export function getFromEmailAddress(): string | null {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!from) return null;
  return extractEmailAddress(from);
}

/**
 * Vérifie que l'expéditeur est utilisable avec Resend.
 * - domaine perso (Gmail…) → invalide
 * - onboarding@resend.dev → OK (tests, destinataires limités)
 * - autre domaine → doit être vérifié dans Resend
 */
export function getFromAddressIssue(): string | null {
  const address = getFromEmailAddress();
  if (!address) {
    return null; // fallback onboarding@resend.dev
  }
  if (address === DEV_FROM_ADDRESS) {
    return null;
  }
  const domain = address.split("@")[1] ?? "";
  if (BLOCKED_FROM_DOMAINS.has(domain)) {
    return (
      `RESEND_FROM_EMAIL (${address}) est une adresse personnelle. ` +
      `Resend exige un domaine vérifié, ou « ${DEV_FROM_ADDRESS} » pour les tests.`
    );
  }
  return null;
}

/** Adresse expéditeur no-reply formatée pour Resend. */
export function getFromAddress(): string {
  const issue = getFromAddressIssue();
  const name = process.env.RESEND_FROM_NAME?.trim() ?? DEFAULT_FROM_NAME;
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  // Évite un From Gmail qui fait échouer tous les envois
  if (issue || !from) {
    return `${name} <${DEV_FROM_ADDRESS}>`;
  }

  if (from.includes("<")) {
    return from;
  }

  return `${name} <${from}>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getEmailConfigStatus(): {
  configured: boolean;
  from: string;
  issue: string | null;
} {
  return {
    configured: isEmailConfigured(),
    from: getFromAddress(),
    issue: getFromAddressIssue(),
  };
}
