/** Exécution sur l'infrastructure Vercel (preview ou production). */
export function isVercelRuntime(): boolean {
  return process.env.VERCEL === "1";
}

/** Développement local (`npm run dev`), pas un déploiement Vercel. */
export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development" && !isVercelRuntime();
}

export type AppRuntime =
  | "local"
  | "vercel-preview"
  | "vercel-production"
  | "production-other";

export function getAppRuntime(): AppRuntime {
  if (isLocalDevelopment()) return "local";
  if (!isVercelRuntime()) {
    return process.env.NODE_ENV === "production" ? "production-other" : "local";
  }
  return process.env.VERCEL_ENV === "production"
    ? "vercel-production"
    : "vercel-preview";
}

export function getRuntimeLabel(): string {
  const map: Record<AppRuntime, string> = {
    local: "Développement local",
    "vercel-preview": "Vercel (preview)",
    "vercel-production": "Vercel (production)",
    "production-other": "Production",
  };
  return map[getAppRuntime()];
}
