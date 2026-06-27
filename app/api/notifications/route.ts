import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.notification.count({
        where: { userId: user.userId, readAt: null },
      }),
    ]);

    return successResponse({ notifications, unreadCount });
  } catch (error) {
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
    return serverErrorResponse(error);
  }
}
