import { prisma } from "@/lib/db/prisma";
import { normalizeUserSettings } from "@/lib/types/user-settings";
import { fetchUserProfile } from "@/lib/user/fetch-user-profile";
import type { UserSettings } from "@/components/providers/user-preferences-provider";

function toProviderSettings(
  settings: Record<string, unknown>
): UserSettings {
  return {
    language: String(settings.language ?? "fr-FR"),
    theme: String(settings.theme ?? "light"),
    studyReminders: Boolean(settings.studyReminders ?? true),
    examResultNotifications: Boolean(
      settings.examResultNotifications ?? settings.emailNotifications ?? true
    ),
    pushNotifications: Boolean(settings.pushNotifications ?? false),
    weeklyReportNotifications: Boolean(
      settings.weeklyReportNotifications ?? true
    ),
    emailNotifications: Boolean(settings.emailNotifications ?? true),
    dailyGoalMinutes: Number(settings.dailyGoalMinutes ?? 30),
    weeklyGoalDays: Number(settings.weeklyGoalDays ?? 5),
  };
}

export async function fetchUserBootstrap(userId: string) {
  const [profile, accounts, settingsRow] = await Promise.all([
    fetchUserProfile(userId),
    prisma.account.findMany({
      where: { userId },
      select: { provider: true },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const settingsSource =
    profile?.settings ??
    (settingsRow
      ? normalizeUserSettings(settingsRow as Record<string, unknown>)
      : null);

  return {
    profile,
    settings: settingsSource
      ? toProviderSettings(settingsSource as Record<string, unknown>)
      : undefined,
    authSession: {
      hasGoogle: accounts.some((account) => account.provider === "google"),
      hasCredentials: accounts.some(
        (account) => account.provider === "credentials"
      ),
    },
  };
}
