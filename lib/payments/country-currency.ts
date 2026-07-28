import type { PaymentCurrency, PaymentMethod } from "@prisma/client";

/** Contexte paiement dérivé du pays de résidence (profil utilisateur). */
export interface PaymentLocaleContext {
  currency: PaymentCurrency;
  countryLabel: string | null;
  /** Indicatif téléphonique suggéré (+237, +225, …) */
  phonePrefix: string | null;
  /** Ordre d’affichage des moyens de paiement */
  preferredMethods: PaymentMethod[];
}

const CEMAC = new Set([
  "cm",
  "cameroun",
  "cameroon",
  "ga",
  "gabon",
  "cg",
  "congo",
  "congo-brazzaville",
  "td",
  "tchad",
  "cf",
  "rca",
  "centrafrique",
  "gq",
  "guinee-equatoriale",
  "guinée équatoriale",
]);

const UEMOA = new Set([
  "sn",
  "senegal",
  "sénégal",
  "ci",
  "cote d'ivoire",
  "côte d'ivoire",
  "ivory coast",
  "ml",
  "mali",
  "bf",
  "burkina",
  "burkina faso",
  "bj",
  "benin",
  "bénin",
  "tg",
  "togo",
  "ne",
  "niger",
  "gw",
  "guinee-bissau",
  "guinée-bissau",
]);

const EUROPE = new Set([
  "fr",
  "france",
  "be",
  "belgique",
  "belgium",
  "ch",
  "suisse",
  "lu",
  "luxembourg",
  "de",
  "allemagne",
  "es",
  "espagne",
  "it",
  "italie",
  "ca",
  "canada",
  "qc",
  "quebec",
  "québec",
  "on",
  "ontario",
  "bc",
]);

const PHONE_PREFIX: Record<string, string> = {
  cm: "+237",
  cameroun: "+237",
  cameroon: "+237",
  ga: "+241",
  gabon: "+241",
  cg: "+242",
  sn: "+221",
  senegal: "+221",
  sénégal: "+221",
  ci: "+225",
  ml: "+223",
  bf: "+226",
  bj: "+229",
  tg: "+228",
  ne: "+227",
  fr: "+33",
  be: "+32",
  ca: "+1",
};

function normalizeCountry(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function resolvePaymentLocaleFromCountry(
  country: string | null | undefined
): PaymentLocaleContext {
  const key = normalizeCountry(country);

  if (!key) {
    return {
      currency: "XAF",
      countryLabel: null,
      phonePrefix: "+237",
      preferredMethods: [
        "MOBILE_MONEY_MTN",
        "MOBILE_MONEY_ORANGE",
        "MOBILE_MONEY",
        "MOBILE_MONEY_WAVE",
        "CARD",
        "GOOGLE_PAY",
        "PAYPAL",
        "BANK_TRANSFER",
      ],
    };
  }

  if (CEMAC.has(key)) {
    return {
      currency: "XAF",
      countryLabel: country ?? null,
      phonePrefix: PHONE_PREFIX[key] ?? "+237",
      preferredMethods: [
        "MOBILE_MONEY_MTN",
        "MOBILE_MONEY_ORANGE",
        "MOBILE_MONEY",
        "MOBILE_MONEY_WAVE",
        "CARD",
        "GOOGLE_PAY",
        "PAYPAL",
        "BANK_TRANSFER",
      ],
    };
  }

  if (UEMOA.has(key)) {
    return {
      currency: "XOF",
      countryLabel: country ?? null,
      phonePrefix: PHONE_PREFIX[key] ?? "+221",
      preferredMethods: [
        "MOBILE_MONEY",
        "MOBILE_MONEY_ORANGE",
        "MOBILE_MONEY_WAVE",
        "MOBILE_MONEY_MOOV",
        "MOBILE_MONEY_MTN",
        "CARD",
        "GOOGLE_PAY",
        "PAYPAL",
        "BANK_TRANSFER",
      ],
    };
  }

  if (EUROPE.has(key)) {
    return {
      currency: "EUR",
      countryLabel: country ?? null,
      phonePrefix: PHONE_PREFIX[key] ?? "+33",
      preferredMethods: ["CARD", "GOOGLE_PAY", "PAYPAL", "SEPA"],
    };
  }

  return {
    currency: "USD",
    countryLabel: country ?? null,
    phonePrefix: PHONE_PREFIX[key] ?? null,
    preferredMethods: ["CARD", "GOOGLE_PAY", "PAYPAL", "MOBILE_MONEY", "MOBILE_MONEY_MTN"],
  };
}

/** Moyens affichés au checkout — liste complète filtrée par devise et providers. */
export const CHECKOUT_METHOD_IDS: PaymentMethod[] = [
  "MOBILE_MONEY_MTN",
  "MOBILE_MONEY_ORANGE",
  "MOBILE_MONEY",
  "MOBILE_MONEY_WAVE",
  "MOBILE_MONEY_MOOV",
  "MOBILE_MONEY_AIRTEL",
  "CARD",
  "GOOGLE_PAY",
  "PAYPAL",
  "SEPA",
  "BANK_TRANSFER",
];

export function sortMethodsForLocale(
  methods: PaymentMethod[],
  preferred: PaymentMethod[]
): PaymentMethod[] {
  const order = new Map(preferred.map((id, index) => [id, index]));
  return [...methods].sort(
    (a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99)
  );
}
