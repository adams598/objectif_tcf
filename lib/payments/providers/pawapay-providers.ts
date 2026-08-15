import type { PaymentMethod } from "@prisma/client";

/** Famille d’opérateur choisie dans l’UI, indépendante du code pawaPay. */
export type PawaPayOperatorFamily =
  | "ORANGE"
  | "MTN"
  | "WAVE"
  | "AIRTEL"
  | "MOOV";

const FAMILY_FROM_METHOD: Partial<Record<PaymentMethod, PawaPayOperatorFamily>> =
  {
    MOBILE_MONEY_ORANGE: "ORANGE",
    MOBILE_MONEY_MTN: "MTN",
    MOBILE_MONEY_WAVE: "WAVE",
    MOBILE_MONEY_AIRTEL: "AIRTEL",
    MOBILE_MONEY_MOOV: "MOOV",
  };

/** Identifiants officiels pawaPay v2 (docs/providers). Orange Cameroun = ORANGE_CMR, pas ORANGE_MONEY_CMR. */
const PROVIDERS: Record<PawaPayOperatorFamily, Record<string, string>> = {
  ORANGE: {
    CMR: "ORANGE_CMR",
    CIV: "ORANGE_CIV",
    SEN: "ORANGE_SEN",
    BFA: "ORANGE_BFA",
    COD: "ORANGE_COD",
    SLE: "ORANGE_SLE",
  },
  MTN: {
    CMR: "MTN_MOMO_CMR",
    CIV: "MTN_MOMO_CIV",
    BEN: "MTN_MOMO_BEN",
    GHA: "MTN_MOMO_GHA",
    COG: "MTN_MOMO_COG",
    RWA: "MTN_MOMO_RWA",
    NGA: "MTN_MOMO_NGA",
    UGA: "MTN_MOMO_UGA",
    ZMB: "MTN_MOMO_ZMB",
  },
  WAVE: {
    CIV: "WAVE_CIV",
    SEN: "WAVE_SEN",
  },
  AIRTEL: {
    GAB: "AIRTEL_GAB",
    COG: "AIRTEL_COG",
    COD: "AIRTEL_COD",
    RWA: "AIRTEL_RWA",
    NGA: "AIRTEL_NGA",
    MWI: "AIRTEL_MWI",
    TZA: "AIRTEL_TZA",
    UGA: "AIRTEL_OAPI_UGA",
    ZMB: "AIRTEL_OAPI_ZMB",
  },
  MOOV: {
    BEN: "MOOV_BEN",
    BFA: "MOOV_BFA",
  },
};

const FALLBACK_COUNTRY: Record<PawaPayOperatorFamily, string> = {
  ORANGE: "CMR",
  MTN: "CMR",
  WAVE: "SEN",
  AIRTEL: "COG",
  MOOV: "BEN",
};

export function isMobileMoneyMethod(method: PaymentMethod): boolean {
  return method === "MOBILE_MONEY" || method.startsWith("MOBILE_MONEY_");
}

export function operatorFamilyFromMethod(
  method: PaymentMethod
): PawaPayOperatorFamily | null {
  return FAMILY_FROM_METHOD[method] ?? null;
}

export function operatorFamilyFromProvider(
  provider: string
): PawaPayOperatorFamily | null {
  const p = provider.toUpperCase();
  if (p.startsWith("ORANGE")) return "ORANGE";
  if (p.startsWith("MTN") || p.includes("_MOMO_")) return "MTN";
  if (p.startsWith("WAVE")) return "WAVE";
  if (p.startsWith("AIRTEL")) return "AIRTEL";
  if (p.startsWith("MOOV")) return "MOOV";
  return null;
}

export function countryFromPawaPayProvider(provider: string): string | null {
  const last = provider.split("_").pop()?.toUpperCase();
  if (last && /^[A-Z]{3}$/.test(last)) return last;
  return null;
}

export function providerForFamilyAndCountry(
  family: PawaPayOperatorFamily,
  countryIso3: string
): string | null {
  const byCountry = PROVIDERS[family];
  return byCountry[countryIso3] ?? byCountry[FALLBACK_COUNTRY[family]] ?? null;
}

/**
 * Le moyen choisi dans l’UI prime (Orange Money → Orange, jamais MoMo).
 * predict-provider ne sert qu’à coller le bon code pays, ou à préremplir
 * si l’utilisateur n’a pas choisi de marque (Mobile Money générique).
 */
export function resolvePawaPayMmoProvider(input: {
  method: PaymentMethod;
  predicted: string | null | undefined;
  countryIso3: string;
}): string | null {
  const family = operatorFamilyFromMethod(input.method);
  const predicted = input.predicted?.trim() || null;
  const predictedFamily = predicted
    ? operatorFamilyFromProvider(predicted)
    : null;
  const predictedCountry = predicted
    ? countryFromPawaPayProvider(predicted)
    : null;
  const country = predictedCountry ?? input.countryIso3;

  if (!family) {
    return predicted;
  }

  if (predicted && predictedFamily === family) {
    return predicted;
  }

  return providerForFamilyAndCountry(family, country);
}
