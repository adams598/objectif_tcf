import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

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

const ADMIN_ROUTES = ["/admin"];
const CORRECTOR_ROUTES = ["/correcteur"];

const AUTH_ROUTES = [
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/reinitialisation-mot-de-passe",
];

async function resolveUser(accessToken: string) {
  try {
    return await verifyAccessToken(accessToken);
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (!accessToken) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const user = await resolveUser(accessToken);

  if (isAuthRoute) {
    if (user) {
      const savedRedirect = request.nextUrl.searchParams.get("redirect");
      if (savedRedirect?.startsWith("/")) {
        return NextResponse.redirect(new URL(savedRedirect, request.url));
      }

      const url = request.nextUrl.clone();
      url.pathname =
        user.role === "ADMIN" || user.role === "SUPER_ADMIN"
          ? "/admin"
          : "/tableau-de-bord";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isProtected) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    if (
      ADMIN_ROUTES.some((route) => pathname.startsWith(route)) &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
    }

    if (
      CORRECTOR_ROUTES.some((route) => pathname.startsWith(route)) &&
      user.role !== "CORRECTOR" &&
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/tableau-de-bord", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|apple-icon|logo\\.png|fonts|images|uploads).*)",
  ],
};
