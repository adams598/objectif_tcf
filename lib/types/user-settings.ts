export interface UserSettingsRecord {
  id: string;
  userId: string;
  language: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  studyReminders: boolean;
  examResultNotifications: boolean;
  weeklyReportNotifications: boolean;
  reminderTime: string;
  weeklyGoalDays: number;
  dailyGoalMinutes: number;
  publicProfile: boolean;
  showInLeaderboard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeUserSettings(
  settings: Record<string, unknown>
): UserSettingsRecord {
  return {
    id: String(settings.id),
    userId: String(settings.userId),
    language: String(settings.language ?? "fr-FR"),
    theme: String(settings.theme ?? "light"),
    emailNotifications: Boolean(settings.emailNotifications ?? true),
    pushNotifications: Boolean(settings.pushNotifications ?? false),
    studyReminders: Boolean(settings.studyReminders ?? true),
    examResultNotifications: Boolean(
      settings.examResultNotifications ?? settings.emailNotifications ?? true
    ),
    weeklyReportNotifications: Boolean(
      settings.weeklyReportNotifications ?? true
    ),
    reminderTime: String(settings.reminderTime ?? "09:00"),
    weeklyGoalDays: Number(settings.weeklyGoalDays ?? 5),
    dailyGoalMinutes: Number(settings.dailyGoalMinutes ?? 30),
    publicProfile: Boolean(settings.publicProfile ?? true),
    showInLeaderboard: Boolean(settings.showInLeaderboard ?? true),
    createdAt: settings.createdAt as Date,
    updatedAt: settings.updatedAt as Date,
  };
}
