import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const page = Math.max(1, parseInt(new URL(req.url).searchParams.get("page") ?? "1", 10));
    const limit = 20;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.communityPost.count({ where: { deletedAt: null } }),
    ]);

    return successResponse({
      posts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
