import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const featureSchema = z.object({
  label: z.string().min(1),
  included: z.boolean(),
});

const offerSchema = z.object({
  examType: z.enum(["TCF_CANADA", "TEF_CANADA", "IELTS"]),
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  subtitle: z.string().max(200).optional().nullable(),
  priceXaf: z.number().int().min(0),
  priceUsd: z.number().int().min(0),
  priceXof: z.number().int().min(0),
  baseDays: z.number().int().min(1),
  bonusDays: z.number().int().min(0).default(0),
  features: z.array(featureSchema).default([]),
  sortOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(true),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const examType = new URL(req.url).searchParams.get("examType");

    const offers = await prisma.subscriptionOffer.findMany({
      where: {
        deletedAt: null,
        ...(examType ? { examType: examType as "TCF_CANADA" | "TEF_CANADA" | "IELTS" } : {}),
      },
      orderBy: [{ examType: "asc" }, { sortOrder: "asc" }],
    });

    return successResponse(offers);
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

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const body = await req.json();
    const parsed = offerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const offer = await prisma.subscriptionOffer.create({
      data: {
        ...parsed.data,
        features: parsed.data.features,
      },
    });

    return createdResponse(offer);
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
