export const ANALYTICS_EVENT_TYPES = [
  "PAGE_VIEW",
  "SIGNUP_VIEW",
  "OFFER_VIEW",
  "CHECKOUT_START",
] as const;

export type AnalyticsEventTypeName = (typeof ANALYTICS_EVENT_TYPES)[number];

const BLOCKED_PREFIXES = [
  "/api",
  "/admin",
  "/correcteur",
  "/tableau-de-bord",
  "/series",
  "/examen",
  "/resultats",
  "/profil",
  "/communaute",
  "/messagerie",
  "/parametres",
  "/onboarding",
  "/documents",
  "/aide",
  "/preparation/examen",
];

const PATH_MAX = 200;
const PATH_RE = /^\/[a-zA-Z0-9\-._/~]*$/;

export function normalizeAnalyticsPath(raw: string): string | null {
  let path = raw.trim();
  if (!path) return null;

  try {
    path = decodeURIComponent(path);
  } catch {
    return null;
  }

  const cut = path.search(/[?#]/);
  if (cut >= 0) path = path.slice(0, cut);

  if (!path.startsWith("/")) return null;
  if (path.includes("..")) return null;

  path = path.replace(/\/{2,}/g, "/");
  if (path.length > 1) path = path.replace(/\/$/, "");
  if (path.length > PATH_MAX) path = path.slice(0, PATH_MAX);
  if (!PATH_RE.test(path)) return null;

  return path;
}

export function isTrackablePath(path: string): boolean {
  return !BLOCKED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function classifyAnalyticsPath(path: string): AnalyticsEventTypeName {
  if (path === "/inscription" || path.startsWith("/inscription/")) {
    return "SIGNUP_VIEW";
  }
  if (path.startsWith("/offres/paiement")) {
    return "CHECKOUT_START";
  }
  if (path === "/offres" || path.startsWith("/offres/")) {
    return "OFFER_VIEW";
  }
  return "PAGE_VIEW";
}
