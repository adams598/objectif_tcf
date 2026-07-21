import { requireRole } from "@/lib/auth/session";
import {
  getPawaPayCallbackUrl,
  getPawaPayDashboardUrl,
  getPawaPayEnvironment,
} from "@/lib/payments/providers/pawapay-config";
import {
  isPawaPayConfigured,
  testPawaPayConnection,
} from "@/lib/payments/providers/pawapay";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

/** Vérifie la config pawaPay (token + active-configuration). Réservé admin. */
export async function GET() {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const connection = isPawaPayConfigured()
      ? await testPawaPayConnection()
      : {
          ok: false,
          environment: getPawaPayEnvironment(),
          message: "PAWAPAY_API_TOKEN manquant dans .env.local",
        };

    return successResponse({
      configured: isPawaPayConfigured(),
      environment: getPawaPayEnvironment(),
      callbackUrl: getPawaPayCallbackUrl(),
      dashboardUrl: getPawaPayDashboardUrl(),
      connection,
      docs: "https://docs.pawapay.io/getting_started",
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
