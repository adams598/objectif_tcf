import type { ExamType, SubscriptionPlan } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface ExamEntitlement {
  examType: ExamType;
  expiresAt: string;
  plan: string;
  autoRenew: boolean;
  cancelAtPeriodEnd: boolean;
}

/** Plans payants donnant accès aux séries premium. FREE ne débloque jamais le premium. */
export const PAID_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  "STARTER",
  "PRO",
  "ELITE",
];

const paidPlanFilter = {
  plan: { in: PAID_SUBSCRIPTION_PLANS },
} as const;

function isMissingExamTypeColumn(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    String(error.message).includes("examType")
  );
}

/** Marque EXPIRED les abonnements dont la période est terminée. */
export async function expireEndedSubscriptions(userId?: string): Promise<number> {
  const now = new Date();
  const result = await prisma.subscription.updateMany({
    where: {
      ...(userId ? { userId } : {}),
      status: "ACTIVE",
      currentPeriodEnd: { lte: now },
    },
    data: {
      status: "EXPIRED",
      autoRenew: false,
      cancelAtPeriodEnd: false,
    },
  });
  return result.count;
}

function activePaidWhere(userId: string, examType?: ExamType) {
  const now = new Date();
  return {
    userId,
    ...(examType ? { examType } : {}),
    status: "ACTIVE" as const,
    currentPeriodEnd: { gt: now },
    ...paidPlanFilter,
  };
}

export async function getActiveExamEntitlements(
  userId: string
): Promise<ExamEntitlement[]> {
  await expireEndedSubscriptions(userId);

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: activePaidWhere(userId),
      select: {
        examType: true,
        plan: true,
        currentPeriodEnd: true,
        autoRenew: true,
        cancelAtPeriodEnd: true,
      },
    });

    return subscriptions.map((sub) => ({
      examType: sub.examType,
      plan: sub.plan,
      expiresAt: sub.currentPeriodEnd.toISOString(),
      autoRenew: sub.autoRenew,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    }));
  } catch (error) {
    if (isMissingExamTypeColumn(error)) {
      console.warn(
        "[subscriptions] colonne examType absente — exécutez: npx prisma db push"
      );
      return [];
    }
    throw error;
  }
}

export async function hasExamAccess(
  userId: string,
  examType: ExamType
): Promise<boolean> {
  await expireEndedSubscriptions(userId);

  try {
    const subscription = await prisma.subscription.findFirst({
      where: activePaidWhere(userId, examType),
      select: { id: true },
    });

    return Boolean(subscription);
  } catch (error) {
    if (isMissingExamTypeColumn(error)) {
      return false;
    }
    throw error;
  }
}

export async function canAccessSeries(
  userId: string | null | undefined,
  series: { isFree: boolean; exam: { type: ExamType } },
  role?: string
): Promise<boolean> {
  if (series.isFree) return true;
  if (!userId) return false;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return true;
  return hasExamAccess(userId, series.exam.type);
}

export function examTypeToTab(examType: ExamType): "tcf" | "tef" | "ielts" {
  if (examType === "TEF_CANADA") return "tef";
  if (examType === "IELTS") return "ielts";
  return "tcf";
}

export async function getLatestActiveSubscription(userId: string): Promise<{
  currentPeriodEnd: Date;
  examType: ExamType;
} | null> {
  await expireEndedSubscriptions(userId);
  const where = activePaidWhere(userId);

  try {
    return await prisma.subscription.findFirst({
      where,
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true, examType: true },
    });
  } catch (error) {
    if (!isMissingExamTypeColumn(error)) {
      throw error;
    }
    console.warn(
      "[subscriptions] colonne examType absente — exécutez: npx prisma db push"
    );
    const legacy = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() },
        ...paidPlanFilter,
      },
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true },
    });
    return legacy
      ? { currentPeriodEnd: legacy.currentPeriodEnd, examType: "TCF_CANADA" }
      : null;
  }
}
