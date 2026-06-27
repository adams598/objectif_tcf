import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/tableau-de-bord",
  "/series",
  "/examen",
  "/resultats",
  "/profil",
  "/communaute",
  "/messagerie",
  "/parametres",
  "/onboarding",
  "/admin",
  "/correcteur",
];

// Admin-only routes
const ADMIN_ROUTES = ["/admin"];

// Corrector routes
const CORRECTOR_ROUTES = ["/correcteur"];

// Auth routes (redirect if already logged in)
const AUTH_ROUTES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation-mot-de-passe",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get access token from cookies
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  let user = null;
  if (accessToken) {
    try {
      user = await verifyAccessToken(accessToken);
    } catch {
      // Token invalid or expired - will be handled below
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = user.role === "ADMIN" || user.role === "SUPER_ADMIN"
        ? "/admin"
        : "/tableau-de-bord";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Check protected routes
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin routes
    if (
      ADMIN_ROUTES.some((route) => pathname.startsWith(route)) &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
    }

    // Check corrector routes
    if (
      CORRECTOR_ROUTES.some((route) => pathname.startsWith(route)) &&
      user.role !== "CORRECTOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
    }

    // Check onboarding completion
    if (
      pathname !== "/onboarding" &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/correcteur") &&
      user.role === "USER"
    ) {
      // Will be checked client-side for better UX
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts|images).*)",
  ],
};
