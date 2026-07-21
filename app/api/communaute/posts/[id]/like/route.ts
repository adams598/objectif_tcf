import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: postId } = await params;

    const post = await prisma.communityPost.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!post) return notFoundResponse("Publication");

    const existing = await prisma.communityLike.findUnique({
      where: {
        postId_userId: { postId, userId: user.userId },
      },
    });

    if (existing) {
      await prisma.communityLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.communityLike.create({
        data: { postId, userId: user.userId },
      });
    }

    const likesCount = await prisma.communityLike.count({ where: { postId } });

    return successResponse({
      liked: !existing,
      likesCount,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
