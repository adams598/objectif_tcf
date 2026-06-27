import { NextResponse } from "next/server";
import {
  getGoogleCredentials,
  getGoogleRedirectUri,
} from "@/lib/auth/google";

/** Diagnostic dev — compare avec Google Cloud Console */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non disponible" }, { status: 404 });
  }

  const credentials = getGoogleCredentials();
  const clientId = credentials?.clientId ?? process.env.GOOGLE_CLIENT_ID?.trim() ?? "";

  return NextResponse.json({
    configured: credentials !== null,
    redirectUri: getGoogleRedirectUri(),
    clientIdPreview: clientId
      ? `${clientId.slice(0, 24)}…${clientId.slice(-20)}`
      : null,
    clientIdLength: clientId.length,
    secretLength: credentials?.clientSecret.length ?? 0,
    secretFormatOk: credentials?.clientSecret.startsWith("GOCSPX") ?? false,
    envSource: "Next.js charge .env.local en priorité sur .env",
    hint:
      credentials === null
        ? "GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET invalide dans .env.local"
        : "Comparez clientIdPreview avec Google Cloud → Credentials → OAuth 2.0 (Web)",
  });
}
