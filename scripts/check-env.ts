/**
 * Vérifie la config selon l'environnement cible (local ou Vercel).
 * Usage :
 *   npm run env:check          → mode local (.env.local)
 *   npm run env:check -- prod  → checklist production (vars Vercel)
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

type Mode = "local" | "prod";

const mode: Mode = process.argv.includes("prod") ? "prod" : "local";
const root = resolve(process.cwd());

function loadEnvFile(name: string): Record<string, string> {
  const path = resolve(root, name);
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const local = loadEnvFile(".env.local");
const base = loadEnvFile(".env");

function get(key: string): string {
  return (local[key] ?? base[key] ?? process.env[key] ?? "").trim();
}

const errors: string[] = [];
const warnings: string[] = [];
const ok: string[] = [];

function requireKey(key: string, minLen = 1) {
  const v = get(key);
  if (!v || v.length < minLen) errors.push(`${key} manquant ou trop court`);
  else ok.push(key);
}

if (mode === "local") {
  console.log("\n🔧 Vérification environnement LOCAL (.env.local)\n");

  if (!existsSync(resolve(root, ".env.local"))) {
    errors.push(
      "Fichier .env.local absent — copiez .env.local.example vers .env.local"
    );
  }

  requireKey("DATABASE_URL", 20);
  requireKey("JWT_SECRET", 32);
  requireKey("JWT_REFRESH_SECRET", 32);
  requireKey("GOOGLE_CLIENT_ID", 20);
  requireKey("GOOGLE_CLIENT_SECRET", 10);

  const appUrl = get("APP_URL") || get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
  if (!appUrl.includes("localhost") && !appUrl.includes("127.0.0.1")) {
    warnings.push(
      `APP_URL=${appUrl} — pour le dev local, préférez http://localhost:3000 (Google OAuth utilise l'URL du navigateur)`
    );
  } else {
    ok.push("APP_URL (local)");
  }

  const blob = get("BLOB_READ_WRITE_TOKEN");
  if (!blob) {
    warnings.push(
      "BLOB_READ_WRITE_TOKEN absent — uploads locaux dans public/uploads/ ; en prod Vercel, créez un Blob store"
    );
  } else {
    ok.push("BLOB_READ_WRITE_TOKEN");
  }

  const pawapayToken = get("PAWAPAY_API_TOKEN");
  const stripeKey = get("STRIPE_SECRET_KEY");
  if (pawapayToken && pawapayToken.length >= 16) {
    ok.push(`PAWAPAY_API_TOKEN (${get("PAWAPAY_ENV") || "sandbox"})`);
    const appUrl = get("APP_URL") || get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
    console.log(`\npawaPay callback à enregistrer dans le dashboard :`);
    console.log(`  ${appUrl.replace(/\/$/, "")}/api/paiement/webhook/pawapay\n`);
  } else if (!stripeKey) {
    warnings.push(
      "PAWAPAY_API_TOKEN absent — Mobile Money Afrique indisponible (voir docs/pawapay-setup.md)"
    );
  }

  console.log("Google OAuth — ajoutez une fois dans Google Cloud Console :");
  console.log("  http://localhost:3000/api/auth/google/callback");
  console.log("  https://objectif-tcf-blue.vercel.app/api/auth/google/callback\n");
} else {
  console.log("\n☁️  Checklist PRODUCTION (variables Vercel, pas les fichiers locaux)\n");
  console.log("À définir dans Vercel → Settings → Environment Variables :\n");
  const prodKeys = [
    "DATABASE_URL",
    "DIRECT_URL",
    "APP_URL",
    "NEXT_PUBLIC_APP_URL",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "RESEND_API_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "PAYMENTS_MOCK_MODE=false",
    "PAWAPAY_API_TOKEN",
    "PAWAPAY_ENV=production",
  ];
  for (const k of prodKeys) console.log(`  • ${k}`);
  console.log("\nAPP_URL / NEXT_PUBLIC_APP_URL = https://objectif-tcf-blue.vercel.app");
  console.log("(sans slash final)\n");
  process.exit(0);
}

for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌ ${e}`);
if (ok.length) console.log(`✅ OK : ${ok.join(", ")}`);

console.log(
  errors.length
    ? "\nCorrigez .env.local puis relancez npm run dev\n"
    : "\nVous pouvez lancer npm run dev\n"
);

process.exit(errors.length ? 1 : 0);
