import type { PaymentCurrency } from "@prisma/client";

/** Pays CEMAC (ISO 3166-1 alpha-3). */
export const PAWAPAY_CEMAC_COUNTRIES = [
  "CMR",
  "GAB",
  "COG",
  "TCD",
  "CAF",
  "GNQ",
] as const;

/** Pays UEMOA (ISO 3166-1 alpha-3). */
export const PAWAPAY_UEMOA_COUNTRIES = [
  "SEN",
  "CIV",
  "MLI",
  "BFA",
  "BEN",
  "TGO",
  "NER",
  "GNB",
] as const;

const PROFILE_TO_ISO3: Record<string, string> = {
  cm: "CMR",
  cameroun: "CMR",
  cameroon: "CMR",
  ga: "GAB",
  gabon: "GAB",
  cg: "COG",
  congo: "COG",
  td: "TCD",
  tchad: "TCD",
  cf: "CAF",
  rca: "CAF",
  centrafrique: "CAF",
  gq: "GNQ",
  sn: "SEN",
  senegal: "SEN",
  "sénégal": "SEN",
  ci: "CIV",
  "cote d'ivoire": "CIV",
  "côte d'ivoire": "CIV",
  ml: "MLI",
  mali: "MLI",
  bf: "BFA",
  "burkina faso": "BFA",
  bj: "BEN",
  benin: "BEN",
  "bénin": "BEN",
  tg: "TGO",
  togo: "TGO",
  ne: "NER",
  niger: "NER",
  gw: "GNB",
};

export function resolveIso3FromProfileCountry(country: string | null | undefined): string | null {
  if (!country?.trim()) return null;
  const key = country.trim().toLowerCase();
  return PROFILE_TO_ISO3[key] ?? null;
}

export function checkoutCountriesForPayment(
  currency: PaymentCurrency,
  profileCountry?: string | null
): string[] {
  const fromProfile = resolveIso3FromProfileCountry(profileCountry);
  if (fromProfile) return [fromProfile];

  if (currency === "XAF") return [...PAWAPAY_CEMAC_COUNTRIES];
  if (currency === "XOF") return [...PAWAPAY_UEMOA_COUNTRIES];
  if (currency === "USD") return ["GHA"];
  return ["CMR"];
}
