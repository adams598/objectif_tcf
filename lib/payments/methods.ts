import type { PaymentCurrency, PaymentMethod, PaymentProvider } from "@prisma/client";
import { isPawaPayConfigured } from "./providers/pawapay";
import { isPaycardConfigured } from "./providers/paycard";
import {
  CHECKOUT_METHOD_IDS,
  sortMethodsForLocale,
  type PaymentLocaleContext,
} from "./country-currency";



export interface PaymentMethodOption {

  id: PaymentMethod;

  label: string;

  description: string;

  icon: string;

  provider: PaymentProvider;

  currencies: PaymentCurrency[];

  regions: string[];

  requiresPhone?: boolean;

}



export const PAYMENT_METHODS: PaymentMethodOption[] = [

  {

    id: "MOBILE_MONEY_MTN",

    label: "MTN Mobile Money",

    description: "MoMo — Cameroun, Côte d'Ivoire, Ghana…",

    icon: "smartphone",

    provider: "PAWAPAY",

    currencies: ["XAF", "XOF", "USD"],

    regions: ["CEMAC", "UEMOA", "Afrique de l'Ouest"],

    requiresPhone: true,

  },

  {

    id: "MOBILE_MONEY",

    label: "Mobile Money",

    description: "Orange, Wave, Moov, Airtel… selon votre pays",

    icon: "payments",

    provider: "PAWAPAY",

    currencies: ["XAF", "XOF", "USD"],

    regions: ["Afrique centrale", "Afrique de l'Ouest"],

    requiresPhone: true,

  },

  {

    id: "CARD",

    label: "Carte bancaire",

    description: "Visa, Mastercard via pawaPay",

    icon: "credit_card",

    provider: "PAWAPAY",

    currencies: ["XAF", "XOF", "USD"],

    regions: ["Afrique", "International"],

  },

  {

    id: "MOBILE_MONEY_ORANGE",

    label: "Orange Money",

    description: "Sénégal, Mali, Cameroun, Côte d'Ivoire…",

    icon: "phone_android",

    provider: "PAWAPAY",

    currencies: ["XAF", "XOF"],

    regions: ["CEMAC", "UEMOA"],

    requiresPhone: true,

  },

  {

    id: "MOBILE_MONEY_AIRTEL",

    label: "Airtel Money",

    description: "Kenya, Ouganda, Tanzanie, RDC…",

    icon: "sim_card",

    provider: "PAWAPAY",

    currencies: ["USD", "XOF"],

    regions: ["Afrique de l'Est", "Afrique centrale"],

    requiresPhone: true,

  },

  {

    id: "MOBILE_MONEY_WAVE",

    label: "Wave",

    description: "Sénégal, Côte d'Ivoire, Mali…",

    icon: "account_balance_wallet",

    provider: "PAWAPAY",

    currencies: ["XOF"],

    regions: ["UEMOA"],

    requiresPhone: true,

  },

  {

    id: "MOBILE_MONEY_MOOV",

    label: "Moov Money",

    description: "Bénin, Togo, Burkina Faso…",

    icon: "payments",

    provider: "PAWAPAY",

    currencies: ["XOF"],

    regions: ["UEMOA"],

    requiresPhone: true,

  },

  {

    id: "BANK_TRANSFER",

    label: "Virement / autres moyens",

    description: "Page pawaPay — opérateurs selon votre pays",

    icon: "account_balance",

    provider: "PAWAPAY",

    currencies: ["XAF", "XOF", "USD"],

    regions: ["Afrique"],

  },

];



export const CURRENCY_OPTIONS: {

  id: PaymentCurrency;

  label: string;

  symbol: string;

  hint: string;

}[] = [

  { id: "XAF", label: "Franc CFA (CEMAC)", symbol: "F CFA", hint: "Cameroun, Gabon, Congo…" },

  { id: "XOF", label: "Franc CFA (UEMOA)", symbol: "XOF", hint: "Sénégal, Côte d'Ivoire, Mali…" },

  { id: "USD", label: "Dollar US", symbol: "$", hint: "International, diaspora" },

];



export function filterMethodsByProviders(
  methods: PaymentMethodOption[]
): PaymentMethodOption[] {
  const pawapay = isPawaPayConfigured();
  const paycard = isPaycardConfigured();

  if (!pawapay && !paycard) return methods.filter((m) => m.provider === "PAWAPAY");

  return methods.filter((m) => {
    if (m.provider === "STRIPE") return false;
    if (
      m.id === "MOBILE_MONEY_ORANGE" ||
      m.id === "MOBILE_MONEY_MTN" ||
      m.id === "MOBILE_MONEY" ||
      m.id === "CARD"
    ) {
      return pawapay || paycard;
    }
    if (m.provider === "PAWAPAY") return pawapay;
    return false;
  });
}



export function getMethodsForCurrency(

  currency: PaymentCurrency

): PaymentMethodOption[] {

  return PAYMENT_METHODS.filter((m) => m.currencies.includes(currency));

}



export function getCheckoutMethodsForCurrency(

  currency: PaymentCurrency,

  locale?: Pick<PaymentLocaleContext, "preferredMethods">

): PaymentMethodOption[] {

  const filtered = filterMethodsByProviders(

    getMethodsForCurrency(currency).filter((m) =>

      CHECKOUT_METHOD_IDS.includes(m.id)

    )

  );

  if (!locale?.preferredMethods?.length) return filtered;

  const order = sortMethodsForLocale(

    filtered.map((m) => m.id),

    locale.preferredMethods

  );

  const rank = new Map(order.map((id, i) => [id, i]));

  return [...filtered].sort(

    (a, b) => (rank.get(a.id) ?? 99) - (rank.get(b.id) ?? 99)

  );

}



export function getProviderForMethod(
  method: PaymentMethod,
  _currency?: PaymentCurrency
): PaymentProvider {
  const isPaycardMethod =
    method === "MOBILE_MONEY_ORANGE" ||
    method === "MOBILE_MONEY_MTN" ||
    method === "MOBILE_MONEY" ||
    method === "CARD";

  if (isPawaPayConfigured()) return "PAWAPAY";
  if (isPaycardConfigured() && isPaycardMethod) return "PAYCARD";
  return "PAWAPAY";
}



export function usdToEur(usdWhole: number): number {

  return Math.max(1, Math.round(usdWhole * 0.92));

}



export function getAmountForCurrency(

  amounts: { xaf: number; xof: number; usd: number; eur: number },

  currency: PaymentCurrency

): number {

  switch (currency) {

    case "XAF":

      return amounts.xaf;

    case "XOF":

      return amounts.xof;

    case "USD":

      return amounts.usd;

    case "EUR":

      return amounts.eur;

    default:

      return amounts.xaf;

  }

}



export function formatPaymentAmount(

  amount: number,

  currency: PaymentCurrency

): string {

  switch (currency) {

    case "USD":

      return `${amount.toLocaleString("fr-FR")} USD`;

    case "EUR":

      return `${amount.toLocaleString("fr-FR")} €`;

    case "XOF":

      return `${amount.toLocaleString("fr-FR")} XOF`;

    default:

      return `${amount.toLocaleString("fr-FR")} F CFA`;

  }

}


