import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { parseGuideTaskItems, serializeGuideTask } from "@/lib/guides/structure";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
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

const itemSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(8000),
});

const updateSchema = z.object({
  heading: z.string().max(200).optional(),
  prompt: z.string().max(8000).optional(),
  items: z.array(itemSchema).max(20).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const parsed = updateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }
    const existing = await prisma.skillGuideTask.findUnique({ where: { id } });
    if (!existing) return notFoundResponse("Tâche introuvable");

    const updated = await prisma.skillGuideTask.update({
      where: { id },
      data: {
        heading: parsed.data.heading,
        prompt: parsed.data.prompt,
        items: parsed.data.items
          ? parseGuideTaskItems(parsed.data.items)
          : undefined,
      },
    });
    return successResponse(serializeGuideTask(updated));
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    await prisma.skillGuideTask.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
