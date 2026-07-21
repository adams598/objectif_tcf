import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    await requireAuth();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [memberCount, postCount, recentAuthors] = await Promise.all([
      prisma.user.count({
        where: { isActive: true, deletedAt: null },
      }),
      prisma.communityPost.count({ where: { deletedAt: null } }),
      prisma.communityPost.findMany({
        where: { deletedAt: null, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: "desc" },
        take: 20,
        distinct: ["authorId"],
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              avatarUrl: true,
              country: true,
              currentLevel: true,
            },
          },
        },
      }),
    ]);

    const activeMembers = recentAuthors.map((post) => ({
      id: post.author.id,
      name:
        [post.author.firstName, post.author.lastName].filter(Boolean).join(" ") ||
        post.author.name,
      avatarUrl: post.author.avatarUrl,
      country: post.author.country ?? "🌍",
      level: post.author.currentLevel ?? null,
    }));

    return successResponse({
      memberCount,
      postCount,
      activeMembers,
      activeThisWeek: activeMembers.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
