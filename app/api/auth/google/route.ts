import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  GOOGLE_OAUTH_ACTION_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
  isGoogleOAuthConfigured,
} from "@/lib/auth/google";

export async function GET(request: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/connexion?error=google_not_configured", request.url)
    );
  }

  try {
    const action = request.nextUrl.searchParams.get("action") ?? "login";
    const redirectTo = request.nextUrl.searchParams.get("redirect");
    const state = createOAuthState();

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 10 * 60,
    };

    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, cookieOptions);
    cookieStore.set(GOOGLE_OAUTH_ACTION_COOKIE, action, cookieOptions);

    if (redirectTo && redirectTo.startsWith("/")) {
      cookieStore.set("oc_google_redirect", redirectTo, cookieOptions);
    }

    return NextResponse.redirect(buildGoogleAuthUrl(state));
  } catch (error) {
    console.error("[Google OAuth] Init error:", error);
    return NextResponse.redirect(
      new URL("/connexion?error=google_auth_failed", request.url)
    );
  }
}
