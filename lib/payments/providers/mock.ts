import type { ProviderChargeParams } from "../types";
import { isPawaPayConfigured } from "./pawapay";
import { isStripeConfigured } from "./stripe";

export function isMockPaymentsEnabled(): boolean {
  if (process.env.PAYMENTS_MOCK_MODE !== "true") return false;
  return !isAnyPaymentProviderConfigured();
}

export function isAnyPaymentProviderConfigured(): boolean {
  return isStripeConfigured() || isPawaPayConfigured();
}

export function createMockCheckout(params: ProviderChargeParams): {
  checkoutUrl: string;
  externalId: string;
} {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const checkoutUrl = `${baseUrl}/offres/paiement/${params.paymentId}/simuler?ref=${params.providerReference}`;

  return {
    checkoutUrl,
    externalId: `mock_${params.providerReference}`,
  };
}
