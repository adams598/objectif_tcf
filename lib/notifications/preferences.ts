import type { NotificationType } from "@prisma/client";

export interface NotificationPreferences {
  studyReminders: boolean;
  examResultNotifications: boolean;
  pushNotifications: boolean;
  weeklyReportNotifications: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  studyReminders: true,
  examResultNotifications: true,
  pushNotifications: false,
  weeklyReportNotifications: true,
};

export function isNotificationTypeEnabled(
  type: NotificationType,
  preferences: NotificationPreferences
): boolean {
  switch (type) {
    case "EXAM_RESULT":
      return preferences.examResultNotifications;
    case "NEW_MESSAGE":
      return preferences.pushNotifications;
    case "CORRECTION_DONE":
    case "ACHIEVEMENT":
      return preferences.examResultNotifications;
    case "SUBSCRIPTION_EXPIRY":
    case "SYSTEM":
      return true;
    default:
      return true;
  }
}

export function filterNotificationsByPreferences<
  T extends { type: NotificationType },
>(items: T[], preferences: NotificationPreferences): T[] {
  return items.filter((item) =>
    isNotificationTypeEnabled(item.type, preferences)
  );
}
