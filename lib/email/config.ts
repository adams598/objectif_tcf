const DEFAULT_FROM_NAME = "Objectif TCF";
const DEV_FROM_ADDRESS = "onboarding@resend.dev";

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    "http://localhost:3000"
  );
}

/** Adresse expéditeur no-reply formatée pour Resend. */
export function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const name = process.env.RESEND_FROM_NAME?.trim() ?? DEFAULT_FROM_NAME;

  if (!from) {
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
