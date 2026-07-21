import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { getPaymentStatsForAdmin } from "@/lib/payments/service";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      totalAttempts,
      completedAttempts,
      subscriptions,
      recentUsers,
      newUsersThisMonth,
      premiumSubscribers,
      paymentStats,
      monthlyRegistrations,
      monthlyRevenue,
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
      prisma.user.count({
        where: { deletedAt: null, createdAt: { gte: monthStart } },
      }),
      prisma.subscription.count({
        where: {
          status: "ACTIVE",
          plan: { in: ["PRO", "ELITE"] },
          currentPeriodEnd: { gt: now },
        },
      }),
      getPaymentStatsForAdmin(),
      prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
        SELECT TO_CHAR("createdAt", 'Mon') as month, COUNT(*)::bigint as count
        FROM "User"
        WHERE "deletedAt" IS NULL
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY TO_CHAR("createdAt", 'Mon'), DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt")
      `.catch(() => []),
      prisma.payment.groupBy({
        by: ["currency"],
        _sum: { amount: true },
        where: {
          status: "SUCCEEDED",
          paidAt: { gte: monthStart },
        },
      }),
    ]);

    const conversionRate =
      totalUsers > 0
        ? Math.round((premiumSubscribers / totalUsers) * 1000) / 10
        : 0;

    return successResponse({
      totalUsers,
      activeUsers,
      totalAttempts,
      completedAttempts,
      subscriptionPlans: subscriptions,
      recentUsers,
      newUsersThisMonth,
      premiumSubscribers,
      conversionRate,
      revenueXaf: paymentStats.revenueXaf,
      revenueThisMonth: monthlyRevenue,
      monthlyRegistrations: monthlyRegistrations.map((r) => ({
        month: r.month,
        users: Number(r.count),
      })),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
