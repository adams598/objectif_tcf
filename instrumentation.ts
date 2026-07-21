export async function register() {
  if (process.env.NODE_ENV !== "production") return;

  const { validateProductionEnv } = await import("@/lib/env/production");
  const result = validateProductionEnv();

  if (result.warnings.length > 0) {
    console.warn("[Objectif TCF] Avertissements production :");
    for (const w of result.warnings) console.warn(`  - ${w}`);
  }

  if (!result.ok) {
    console.error("[Objectif TCF] Configuration production invalide :");
    for (const e of result.errors) console.error(`  - ${e}`);
    console.error(
      "Consultez docs/deploiement-hostinger.md avant la mise en ligne."
    );
  }
}
