import { prisma } from "@/lib/db/prisma";
import { validateProductionEnv } from "@/lib/env/production";

export const dynamic = "force-dynamic";

/** Health check pour Hostinger / monitoring (sans auth). */
export async function GET() {
  const checks: Record<string, "ok" | "error"> = {};
  let dbOk = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    checks.database = "ok";
  } catch {
    checks.database = "error";
  }

  const production =
    process.env.NODE_ENV === "production"
      ? validateProductionEnv()
      : { ok: true, errors: [], warnings: [] };

  const healthy = dbOk && (process.env.NODE_ENV !== "production" || production.ok);

  return Response.json(
    {
      status: healthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV ?? "development",
      checks,
      production:
        process.env.NODE_ENV === "production"
          ? {
              ok: production.ok,
              errors: production.errors,
              warnings: production.warnings,
            }
          : undefined,
    },
    { status: healthy ? 200 : 503 }
  );
}
