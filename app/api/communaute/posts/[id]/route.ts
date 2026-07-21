import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth, requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  content: z.string().min(1).max(2000),
});

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const post = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) return notFoundResponse("Publication");
    if (post.authorId !== user.userId) {
      return forbiddenResponse();
    }

    const updated = await prisma.communityPost.update({
      where: { id },
      data: { content: parsed.data.content },
    });

    return successResponse(updated, "Publication modifiée");
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const post = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) return notFoundResponse("Publication");

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (post.authorId !== user.userId && !isAdmin) {
      return forbiddenResponse();
    }

    await prisma.communityPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const post = await prisma.communityPost.findFirst({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!post) return notFoundResponse("Publication");

    return successResponse(post);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
