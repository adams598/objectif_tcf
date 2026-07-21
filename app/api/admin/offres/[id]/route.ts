import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

const updateSchema = z.object({
  examType: z.enum(["TCF_CANADA", "TEF_CANADA", "IELTS"]).optional(),
  name: z.string().min(2).max(120).optional(),
  slug: z.string().min(2).max(120).optional(),
  subtitle: z.string().max(200).optional().nullable(),
  priceXaf: z.number().int().min(0).optional(),
  priceUsd: z.number().int().min(0).optional(),
  priceXof: z.number().int().min(0).optional(),
  baseDays: z.number().int().min(1).optional(),
  bonusDays: z.number().int().min(0).optional(),
  features: z
    .array(z.object({ label: z.string(), included: z.boolean() }))
    .optional(),
  sortOrder: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.subscriptionOffer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return notFoundResponse("Offre");
    }

    const offer = await prisma.subscriptionOffer.update({
      where: { id },
      data: parsed.data,
    });

    return successResponse(offer);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    return serverErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const existing = await prisma.subscriptionOffer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return notFoundResponse("Offre");
    }

    await prisma.subscriptionOffer.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return successResponse({ message: "Offre supprimée" });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    return serverErrorResponse(error);
  }
}
