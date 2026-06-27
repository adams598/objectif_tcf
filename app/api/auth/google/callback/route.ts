import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { signAccessToken, signRefreshToken } from "@/lib/auth/jwt";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  GOOGLE_OAUTH_ACTION_COOKIE,
  GOOGLE_OAUTH_STATE_COOKIE,
} from "@/lib/auth/google";

function redirectWithError(
  request: NextRequest,
  error: string,
  action: string = "login"
) {
  const basePath = action === "register" ? "/inscription" : "/connexion";
  return NextResponse.redirect(new URL(`${basePath}?error=${error}`, request.url));
}

async function createSessionForUser(
  request: NextRequest,
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    onboardingCompleted: boolean;
  }
) {
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(tokenPayload),
    signRefreshToken(tokenPayload),
  ]);

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      refreshToken,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ??
        request.headers.get("x-real-ip") ??
        undefined,
      expiresAt,
    },
  });

  await setAuthCookies(accessToken, refreshToken);

  void prisma.auditLog
    .create({
      data: {
        userId: user.id,
        action: "LOGIN_GOOGLE",
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0] ?? undefined,
      },
    })
    .catch(console.error);

  const cookieStore = await cookies();
  const savedRedirect = cookieStore.get("oc_google_redirect")?.value;
  cookieStore.delete("oc_google_redirect");

  let destination = "/tableau-de-bord";
  if (savedRedirect?.startsWith("/")) {
    destination = savedRedirect;
  } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    destination = "/admin";
  } else if (!user.onboardingCompleted) {
    destination = "/onboarding";
  }

  return NextResponse.redirect(new URL(destination, request.url));
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const savedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  const action = cookieStore.get(GOOGLE_OAUTH_ACTION_COOKIE)?.value ?? "login";

  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);
  cookieStore.delete(GOOGLE_OAUTH_ACTION_COOKIE);

  if (oauthError) {
    console.error("[Google OAuth] Provider error:", oauthError);
    return redirectWithError(request, "google_denied", action);
  }

  if (!code || !state || !savedState || state !== savedState) {
    return redirectWithError(request, "google_invalid_state", action);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    const googleUser = await fetchGoogleUserInfo(tokens.access_token);

    if (!googleUser.email || !googleUser.verified_email) {
      return redirectWithError(request, "google_email_unverified", action);
    }

    const tokenExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : undefined;

    const existingGoogleAccount = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleUser.id,
        },
      },
      include: { user: true },
    });

    if (existingGoogleAccount) {
      if (!existingGoogleAccount.user.isActive) {
        return redirectWithError(request, "account_disabled", action);
      }

      await prisma.account.update({
        where: { id: existingGoogleAccount.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? existingGoogleAccount.refreshToken,
          tokenExpiresAt,
        },
      });

      if (googleUser.picture && !existingGoogleAccount.user.avatarUrl) {
        await prisma.user.update({
          where: { id: existingGoogleAccount.user.id },
          data: { avatarUrl: googleUser.picture },
        });
      }

      return createSessionForUser(request, existingGoogleAccount.user);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: {
        accounts: true,
      },
    });

    if (existingUser) {
      const hasCredentials = existingUser.accounts.some(
        (account) => account.provider === "credentials"
      );

      if (hasCredentials && action === "register") {
        return NextResponse.redirect(
          new URL("/inscription?error=email_exists", request.url)
        );
      }

      if (!existingUser.isActive) {
        return redirectWithError(request, "account_disabled", action);
      }

      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: "google",
          providerAccountId: googleUser.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt,
        },
      });

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          emailVerified: true,
          avatarUrl: existingUser.avatarUrl ?? googleUser.picture,
          firstName: existingUser.firstName ?? googleUser.given_name,
          lastName: existingUser.lastName ?? googleUser.family_name,
        },
      });

      return createSessionForUser(request, updatedUser);
    }

    const newUser = await prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split("@")[0],
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        avatarUrl: googleUser.picture,
        emailVerified: true,
        accounts: {
          create: {
            provider: "google",
            providerAccountId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiresAt,
          },
        },
        settings: {
          create: {},
        },
      },
    });

    return createSessionForUser(request, newUser);
  } catch (error) {
    console.error("[Google OAuth] Callback error:", error);
    return redirectWithError(request, "google_auth_failed", action);
  }
}
