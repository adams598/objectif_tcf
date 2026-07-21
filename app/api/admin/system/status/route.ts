import { requireRole } from "@/lib/auth/session";
import { validateProductionEnv, getPublicAppUrl } from "@/lib/env/production";
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
      appUrl: getPublicAppUrl(),
      production,
      payments: {
        stripe: {
          configured: isStripeConfigured(),
          webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
          webhookUrl: `${getPublicAppUrl()}/api/paiement/webhook/stripe`,
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
        stripe: `${getPublicAppUrl()}/api/paiement/webhook/stripe`,
        pawapay: `${getPublicAppUrl()}/api/paiement/webhook/pawapay`,
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
