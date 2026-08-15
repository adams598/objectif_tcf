import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  getPaymentForUser,
  toPaymentSessionDetails,
} from "@/lib/payments/service";
import {
  getCheckoutMethodsForCurrency,
  CURRENCY_OPTIONS,
} from "@/lib/payments/methods";
import { resolvePaymentLocaleFromCountry } from "@/lib/payments/country-currency";
import type { PaymentCurrency } from "@prisma/client";
import {
  isMockPaymentsEnabled,
  isAnyPaymentProviderConfigured,
} from "@/lib/payments/providers/mock";
import { isPawaPayConfigured } from "@/lib/payments/providers/pawapay";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const payment = await getPaymentForUser(id, user.userId);
    if (!payment) {
      return notFoundResponse("Paiement");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { country: true, phone: true },
    });

    const paymentLocale = resolvePaymentLocaleFromCountry(dbUser?.country);

    const methodsByCurrency = Object.fromEntries(
      CURRENCY_OPTIONS.map((option) => [
        option.id,
        getCheckoutMethodsForCurrency(option.id, paymentLocale),
      ])
    ) as Record<PaymentCurrency, ReturnType<typeof getCheckoutMethodsForCurrency>>;

    return successResponse({
      payment: toPaymentSessionDetails(payment),
      methodsByCurrency,
      paymentLocale,
      suggestedCurrency: paymentLocale.currency,
      userPhone: dbUser?.phone ?? null,
      mockMode: isMockPaymentsEnabled(),
      providersConfigured: isAnyPaymentProviderConfigured(),
      pawapayConfigured: isPawaPayConfigured(),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
