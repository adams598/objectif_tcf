import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  createdResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

const createCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id: postId } = await params;

    const post = await prisma.communityPost.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!post) return notFoundResponse("Publication");

    const comments = await prisma.communityComment.findMany({
      where: { postId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return successResponse({ comments });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: postId } = await params;
    const body = await req.json();

    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const post = await prisma.communityPost.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });

    if (!post) return notFoundResponse("Publication");

    const comment = await prisma.communityComment.create({
      data: {
        postId,
        authorId: user.userId,
        content: parsed.data.content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return createdResponse(comment);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
