import { NextResponse } from "next/server";
import {
  getGoogleCredentials,
  getGoogleRedirectUri,
} from "@/lib/auth/google";
import {
  getGoogleCallbackUriForCurrentEnv,
  resolveAppUrl,
} from "@/lib/env/app-url";
import { getAppRuntime, getRuntimeLabel } from "@/lib/env/runtime";

/** Diagnostic local — URLs OAuth à comparer avec Google Cloud Console */
export async function GET() {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 404 });
  }

  const credentials = getGoogleCredentials();
  const clientId = credentials?.clientId ?? process.env.GOOGLE_CLIENT_ID?.trim() ?? "";

  return NextResponse.json({
    runtime: getAppRuntime(),
    runtimeLabel: getRuntimeLabel(),
    appUrl: resolveAppUrl(),
    configured: credentials !== null,
    redirectUriFromEnv: getGoogleRedirectUri(),
    redirectUriAtRuntime: getGoogleCallbackUriForCurrentEnv(),
    redirectUriUsedByBrowser:
      "http://localhost:3000/api/auth/google/callback (connexion depuis localhost)",
    googleConsoleRedirectUris: [
      "http://localhost:3000/api/auth/google/callback",
      "https://objectif-tcf-blue.vercel.app/api/auth/google/callback",
    ],
    clientIdPreview: clientId
      ? `${clientId.slice(0, 24)}…${clientId.slice(-20)}`
      : null,
    hint:
      credentials === null
        ? "Renseignez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local"
        : "Les deux redirect URI ci-dessus doivent être dans Google Cloud → Credentials",
  });
}
