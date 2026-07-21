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
} from "@/lib/utils/api-response";

const pricingSchema = z.object({
  examType: z.enum(["TCF_CANADA", "TEF_CANADA", "IELTS"]),
  pricePerDayXaf: z.number().int().min(1),
  pricePerDayUsd: z.number().int().min(1),
  pricePerDayXof: z.number().int().min(1),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const configs = await prisma.examPricingConfig.findMany({
      orderBy: { examType: "asc" },
    });

    return successResponse(configs);
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

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const body = await req.json();
    const parsed = pricingSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const config = await prisma.examPricingConfig.upsert({
      where: { examType: parsed.data.examType },
      create: parsed.data,
      update: parsed.data,
    });

    return successResponse(config);
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
