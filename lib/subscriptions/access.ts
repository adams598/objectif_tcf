import type { ExamType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface ExamEntitlement {
  examType: ExamType;
  expiresAt: string;
  plan: string;
}

function isMissingExamTypeColumn(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    String(error.message).includes("examType")
  );
}

export async function getActiveExamEntitlements(
  userId: string
): Promise<ExamEntitlement[]> {
  const now = new Date();

  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gt: now },
      },
      select: {
        examType: true,
        plan: true,
        currentPeriodEnd: true,
      },
    });

    return subscriptions.map((sub) => ({
      examType: sub.examType,
      plan: sub.plan,
      expiresAt: sub.currentPeriodEnd.toISOString(),
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
  const now = new Date();

  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        examType,
        status: "ACTIVE",
        currentPeriodEnd: { gt: now },
      },
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
  const now = new Date();
  const where = {
    userId,
    status: "ACTIVE" as const,
    currentPeriodEnd: { gt: now },
  };

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
      where,
      orderBy: { currentPeriodEnd: "desc" },
      select: { currentPeriodEnd: true },
    });
    return legacy
      ? { currentPeriodEnd: legacy.currentPeriodEnd, examType: "TCF_CANADA" }
      : null;
  }
}
