import type { ExamType, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { cancelStripeSubscriptionAtPeriodEnd } from "@/lib/payments/providers/stripe";

export type CancelSubscriptionResult = {
  subscription: Subscription;
  effectiveUntil: string;
  message: string;
};

/**
 * Annule le renouvellement automatique.
 * L'accès reste actif jusqu'à currentPeriodEnd — aucun remboursement.
 */
export async function cancelSubscriptionAtPeriodEnd(
  userId: string,
  examType: ExamType
): Promise<CancelSubscriptionResult | null> {
  const subscription = await prisma.subscription.findUnique({
    where: {
      userId_examType: { userId, examType },
    },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return null;
  }

  if (subscription.currentPeriodEnd <= new Date()) {
    return null;
  }

  if (subscription.stripeSubscriptionId) {
    try {
      await cancelStripeSubscriptionAtPeriodEnd(subscription.stripeSubscriptionId);
    } catch (error) {
      console.error(
        "[subscriptions] échec annulation Stripe:",
        error instanceof Error ? error.message : error
      );
      throw new Error("STRIPE_CANCEL_FAILED");
    }
  }

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      autoRenew: false,
      cancelAtPeriodEnd: true,
    },
  });

  return {
    subscription: updated,
    effectiveUntil: updated.currentPeriodEnd.toISOString(),
    message:
      "Abonnement annulé. Aucun remboursement : l'accès reste actif jusqu'à la fin de la période en cours, sans renouvellement.",
  };
}

export async function listActiveSubscriptionsForUser(userId: string) {
  const now = new Date();
  return prisma.subscription.findMany({
    where: {
      userId,
      status: "ACTIVE",
      currentPeriodEnd: { gt: now },
      plan: { in: ["STARTER", "PRO", "ELITE"] },
    },
    select: {
      id: true,
      examType: true,
      plan: true,
      status: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      autoRenew: true,
      cancelAtPeriodEnd: true,
      renewalDays: true,
    },
    orderBy: { currentPeriodEnd: "desc" },
  });
}
