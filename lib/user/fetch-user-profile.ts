import { prisma } from "@/lib/db/prisma";
import type { ExamType } from "@prisma/client";
import { normalizeUserProfile } from "@/lib/user/profile";
import { normalizeUserSettings } from "@/lib/types/user-settings";

const userSelect = {
  id: true,
  email: true,
  emailVerified: true,
  name: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  phone: true,
  country: true,
  nativeLanguage: true,
  role: true,
  onboardingCompleted: true,
  immigrationObjective: true,
  currentLevel: true,
  targetExamDate: true,
  targetCountry: true,
  totalStudyTime: true,
  currentStreak: true,
  longestStreak: true,
  createdAt: true,
  settings: {
    select: {
      language: true,
      theme: true,
      studyReminders: true,
      emailNotifications: true,
      pushNotifications: true,
      dailyGoalMinutes: true,
      weeklyGoalDays: true,
      examResultNotifications: true,
      weeklyReportNotifications: true,
    },
  },
} as const;

export async function fetchUserProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!profile) return null;

  let subscriptions: Array<{
    plan: "FREE" | "STARTER" | "PRO" | "ELITE";
    status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "TRIALING" | "PAST_DUE";
    examType: ExamType;
    currentPeriodEnd: Date;
  }> = [];

  try {
    subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() },
      },
      select: {
        plan: true,
        status: true,
        examType: true,
        currentPeriodEnd: true,
      },
      orderBy: { currentPeriodEnd: "desc" },
    });
  } catch (error) {
    console.error("[profil] subscriptions fetch failed:", error);
  }

  return normalizeUserProfile({
    ...profile,
    subscriptions,
    settings: profile.settings
      ? (normalizeUserSettings(
          profile.settings as Record<string, unknown>
        ) as unknown as Record<string, unknown>)
      : null,
  });
}
