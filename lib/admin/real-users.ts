import type { Prisma } from "@prisma/client";

/** Préfixe des faux comptes créés par l’ancien seed analytics démo. */
export const ANALYTICS_DEMO_EMAIL_PREFIX = "analytics.demo.";

export function excludeAnalyticsDemoUsers(): Prisma.UserWhereInput {
  return {
    NOT: { email: { startsWith: ANALYTICS_DEMO_EMAIL_PREFIX } },
  };
}

/** Utilisateurs réels uniquement (hors soft-delete et hors seed démo). */
export function realUsersWhere(
  extra: Prisma.UserWhereInput = {}
): Prisma.UserWhereInput {
  return {
    AND: [{ deletedAt: null }, excludeAnalyticsDemoUsers(), extra],
  };
}
