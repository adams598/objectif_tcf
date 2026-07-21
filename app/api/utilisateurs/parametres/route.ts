import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";
import { normalizeUserSettings } from "@/lib/types/user-settings";

const settingsSchema = z.object({
  language: z.string().max(10).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  studyReminders: z.boolean().optional(),
  examResultNotifications: z.boolean().optional(),
  weeklyReportNotifications: z.boolean().optional(),
  reminderTime: z.string().max(10).optional(),
  weeklyGoalDays: z.number().int().min(1).max(7).optional(),
  dailyGoalMinutes: z.number().int().min(5).max(480).optional(),
  publicProfile: z.boolean().optional(),
  showInLeaderboard: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.userId },
    });

    if (!settings) {
      const created = await prisma.userSettings.create({
        data: { userId: user.userId },
      });
      return successResponse(
        normalizeUserSettings(created as Record<string, unknown>)
      );
    }

    return successResponse(
      normalizeUserSettings(settings as Record<string, unknown>)
    );
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId: user.userId },
      create: { userId: user.userId, ...parsed.data },
      update: parsed.data,
    });

    return successResponse(normalizeUserSettings(settings as Record<string, unknown>));
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
