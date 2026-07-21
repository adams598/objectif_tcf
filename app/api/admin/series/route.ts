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

const seriesSchema = z.object({
  examId: z.string().min(1),
  skill: z.enum([
    "COMPREHENSION_ORALE",
    "COMPREHENSION_ECRITE",
    "EXPRESSION_ECRITE",
    "EXPRESSION_ORALE",
    "LEXIQUE",
  ]),
  title: z.string().min(2).max(200),
  description: z.string().max(500).optional().nullable(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).default("B1"),
  durationMin: z.number().int().min(1).max(180).default(30),
  order: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
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

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const skill = searchParams.get("skill");

    const series = await prisma.examSeries.findMany({
      where: {
        deletedAt: null,
        ...(examId ? { examId } : {}),
        ...(skill ? { skill: skill as never } : {}),
      },
      orderBy: [{ order: "asc" }, { skill: "asc" }],
      include: {
        exam: { select: { type: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return successResponse(series);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = seriesSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const series = await prisma.examSeries.create({
      data: parsed.data,
      include: {
        exam: { select: { type: true, title: true } },
        _count: { select: { questions: true } },
      },
    });

    return createdResponse(series);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
