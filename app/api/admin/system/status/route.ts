import { requireRole } from "@/lib/auth/session";
import { validateProductionEnv } from "@/lib/env/production";
import { resolveAppUrl } from "@/lib/env/app-url";
import { getGoogleRedirectUri } from "@/lib/auth/google";
import { getPawaPayCallbackUrl, getPawaPayEnvironment } from "@/lib/payments/providers/pawapay-config";
import {
  isPawaPayConfigured,
  testPawaPayConnection,
} from "@/lib/payments/providers/pawapay";
import { isStripeConfigured } from "@/lib/payments/providers/stripe";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

/** État système pour le dashboard admin (prod + paiements). */
export async function GET() {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const production = validateProductionEnv();
    const pawapayConnection = isPawaPayConfigured()
      ? await testPawaPayConnection()
      : null;

    return successResponse({
      environment: process.env.NODE_ENV ?? "development",
      appUrl: resolveAppUrl(),
      production,
      googleOAuth: {
        redirectUri: getGoogleRedirectUri(),
        hint:
          "Ajoutez cette URL exacte dans Google Cloud Console → Credentials → OAuth 2.0 → Authorized redirect URIs",
      },
      payments: {
        stripe: {
          configured: isStripeConfigured(),
          webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
          webhookUrl: `${resolveAppUrl()}/api/paiement/webhook/stripe`,
        },
        pawapay: {
          configured: isPawaPayConfigured(),
          environment: getPawaPayEnvironment(),
          callbackUrl: getPawaPayCallbackUrl(),
          connection: pawapayConnection,
        },
        mockMode: process.env.PAYMENTS_MOCK_MODE === "true",
      },
      webhooks: {
        stripe: `${resolveAppUrl()}/api/paiement/webhook/stripe`,
        pawapay: `${resolveAppUrl()}/api/paiement/webhook/pawapay`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    return serverErrorResponse(error);
  }
}
