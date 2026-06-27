import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const profile = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        settings: {
          select: {
            language: true,
            theme: true,
            studyReminders: true,
            dailyGoalMinutes: true,
            weeklyGoalDays: true,
          },
        },
        subscriptions: {
          select: { plan: true, status: true, currentPeriodEnd: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    return successResponse(profile);
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: parsed.data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
