import type { ProviderChargeParams } from "../types";
import { resolveAppUrl } from "@/lib/env/app-url";
import { isPawaPayConfigured } from "./pawapay";
import { isPaycardConfigured } from "./paycard";

export function isMockPaymentsEnabled(): boolean {
  if (process.env.PAYMENTS_MOCK_MODE !== "true") return false;
  return !isAnyPaymentProviderConfigured();
}

export function isAnyPaymentProviderConfigured(): boolean {
  return isPawaPayConfigured() || isPaycardConfigured();
}

export function createMockCheckout(params: ProviderChargeParams): {
  checkoutUrl: string;
  externalId: string;
} {
  const baseUrl = resolveAppUrl();
  const checkoutUrl = `${baseUrl}/offres/paiement/${params.paymentId}/simuler?ref=${params.providerReference}`;

  return {
    checkoutUrl,
    externalId: `mock_${params.providerReference}`,
  };
}
