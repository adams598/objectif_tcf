import type { SubscriptionPlan } from "@prisma/client";

/** Déduit le plan d'abonnement à partir du nom/slug d'offre ou de la durée. */
export function inferSubscriptionPlan(input: {
  offerName?: string | null;
  offerSlug?: string | null;
  subscriptionDays?: number | null;
}): SubscriptionPlan {
  const label = `${input.offerSlug ?? ""} ${input.offerName ?? ""}`.toLowerCase();

  if (label.includes("decouverte") || label.includes("découverte")) {
    return "STARTER";
  }
  if (
    label.includes("approfondi") ||
    label.includes("premium") ||
    label.includes("elite") ||
    label.includes("60")
  ) {
    return "ELITE";
  }
  if (label.includes("intense") || label.includes("pro")) {
    return "PRO";
  }

  const days = input.subscriptionDays ?? 0;
  if (days <= 20) return "STARTER";
  if (days >= 40) return "ELITE";
  return "PRO";
}
