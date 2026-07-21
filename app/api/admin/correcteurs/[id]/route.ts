import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["CORRECTOR", "USER"]).optional(),
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
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.user.findFirst({
      where: { id, role: "CORRECTOR", deletedAt: null },
    });
    if (!existing) return notFoundResponse("Correcteur");

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true,
        email: true,
        isActive: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_UPDATE_CORRECTOR",
        entity: "User",
        entityId: id,
        metadata: parsed.data,
      },
    });

    return successResponse(user, "Correcteur mis à jour");
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

    const corrector = await prisma.user.findFirst({
      where: { id, role: "CORRECTOR", deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        corrections: {
          orderBy: { correctedAt: "desc" },
          take: 20,
          select: {
            id: true,
            score: true,
            status: true,
            correctedAt: true,
            student: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!corrector) return notFoundResponse("Correcteur");

    return successResponse(corrector);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
