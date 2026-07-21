import { randomUUID } from "crypto";
import { getGoogleCallbackUriFromOrigin, resolveAppUrl } from "@/lib/env/app-url";

export const GOOGLE_OAUTH_STATE_COOKIE = "oc_google_oauth_state";
export const GOOGLE_OAUTH_ACTION_COOKIE = "oc_google_oauth_action";
export const GOOGLE_OAUTH_REDIRECT_URI_COOKIE = "oc_google_redirect_uri";

export interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type: string;
}

export function getAppUrl(): string {
  return resolveAppUrl();
}

export function getGoogleRedirectUri(): string {
  return `${getAppUrl()}/api/auth/google/callback`;
}

export { getGoogleCallbackUriFromOrigin };

export function getGoogleCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (
    !clientId ||
    !clientSecret ||
    clientId.includes("your-google") ||
    clientSecret.includes("your-google") ||
    !clientId.endsWith(".apps.googleusercontent.com")
  ) {
    return null;
  }

  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(): boolean {
  return getGoogleCredentials() !== null;
}

export function buildGoogleAuthUrl(state: string, redirectUri: string): string {
  const credentials = getGoogleCredentials();
  if (!credentials) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const { clientId } = credentials;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const credentials = getGoogleCredentials();
  if (!credentials) {
    throw new Error("Google OAuth is not configured");
  }

  const { clientId, clientSecret } = credentials;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google token exchange failed: ${errorBody}`);
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<GoogleUserInfo> {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Google user profile");
  }

  return response.json() as Promise<GoogleUserInfo>;
}

export function createOAuthState(): string {
  return randomUUID();
}
