import type { ExamTab } from "./constants";
import { isValidPreparationDays } from "./constants";

export type CheckoutIntent =
  | { type: "custom"; examTab: ExamTab; days: number }
  | { type: "offer"; examTab: ExamTab; offerId: string };

const CHECKOUT_INTENT_KEY = "oc_checkout_intent";

export function buildOffersCheckoutPath(intent: CheckoutIntent): string {
  const params = new URLSearchParams();
  params.set("examen", intent.examTab);
  params.set("checkout", intent.type);

  if (intent.type === "custom") {
    params.set("days", String(intent.days));
  } else {
    params.set("offerId", intent.offerId);
  }

  return `/offres?${params.toString()}`;
}

export function buildPaymentPagePath(paymentId: string): string {
  return `/offres/paiement/${paymentId}`;
}

export function buildAuthRedirectUrl(
  intent: CheckoutIntent,
  mode: "connexion" | "inscription" = "connexion"
): string {
  const returnPath = buildOffersCheckoutPath(intent);
  return `/${mode}?redirect=${encodeURIComponent(returnPath)}`;
}

export function saveCheckoutIntent(intent: CheckoutIntent): void {
  try {
    sessionStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // ignore
  }
}

export function loadCheckoutIntent(): CheckoutIntent | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_INTENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CheckoutIntent;
  } catch {
    return null;
  }
}

export function clearCheckoutIntent(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_INTENT_KEY);
  } catch {
    // ignore
  }
}

export function parseCheckoutFromSearchParams(
  searchParams: URLSearchParams
): CheckoutIntent | null {
  const checkout = searchParams.get("checkout");
  const examTab = searchParams.get("examen");
  if (!checkout || !examTab) return null;

  const tab =
    examTab === "tef" || examTab === "ielts" ? examTab : ("tcf" as ExamTab);

  if (checkout === "custom") {
    const days = parseInt(searchParams.get("days") ?? "", 10);
    if (!isValidPreparationDays(days)) return null;
    return { type: "custom", examTab: tab, days };
  }

  if (checkout === "offer") {
    const offerId = searchParams.get("offerId");
    if (!offerId) return null;
    return { type: "offer", examTab: tab, offerId };
  }

  return null;
}
