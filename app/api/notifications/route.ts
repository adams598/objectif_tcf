import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  filterNotificationsByPreferences,
} from "@/lib/notifications/preferences";
import { normalizeUserSettings } from "@/lib/types/user-settings";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    });

    const normalized = settings
      ? normalizeUserSettings(settings as Record<string, unknown>)
      : null;

    const preferences = {
      studyReminders:
        normalized?.studyReminders ??
        DEFAULT_NOTIFICATION_PREFERENCES.studyReminders,
      examResultNotifications:
        normalized?.examResultNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.examResultNotifications,
      pushNotifications:
        normalized?.pushNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.pushNotifications,
      weeklyReportNotifications:
        normalized?.weeklyReportNotifications ??
        DEFAULT_NOTIFICATION_PREFERENCES.weeklyReportNotifications,
    };

    const [allNotifications, unreadCountRaw] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId: user.userId, readAt: null },
      }),
    ]);

    const notifications = filterNotificationsByPreferences(
      allNotifications,
      preferences
    );

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return successResponse({
      notifications: notifications.slice(0, 20),
      unreadCount,
      preferences,
      totalBeforeFilter: allNotifications.length,
      unreadBeforeFilter: unreadCountRaw,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const user = await requireAuth();

    await prisma.notification.updateMany({
      where: { userId: user.userId, readAt: null },
      data: { readAt: new Date() },
    });

    return successResponse({ message: "Toutes les notifications marquées comme lues" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
