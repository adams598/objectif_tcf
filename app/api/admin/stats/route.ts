import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const [
      totalUsers,
      activeUsers,
      totalAttempts,
      completedAttempts,
      subscriptions,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({
        where: {
          deletedAt: null,
          sessions: { some: { expiresAt: { gt: new Date() } } },
        },
      }),
      prisma.attempt.count(),
      prisma.attempt.count({ where: { status: "COMPLETED" } }),
      prisma.subscription.groupBy({
        by: ["plan"],
        _count: { _all: true },
        where: { status: "ACTIVE" },
      }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
          subscriptions: {
            select: { plan: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);

    return successResponse({
      totalUsers,
      activeUsers,
      totalAttempts,
      completedAttempts,
      subscriptionPlans: subscriptions,
      recentUsers,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
