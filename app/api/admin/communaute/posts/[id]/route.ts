import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const post = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
    });

    if (!post) return notFoundResponse("Publication");

    await prisma.communityPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_DELETE_POST",
        entity: "CommunityPost",
        entityId: id,
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
