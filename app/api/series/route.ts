import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

const querySchema = z.object({
  skill: z
    .enum(["COMPREHENSION_ORALE", "COMPREHENSION_ECRITE", "EXPRESSION_ECRITE", "EXPRESSION_ORALE", "LEXIQUE"])
    .optional(),
  difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(12),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { skill, difficulty, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      ...(skill ? { skill } : {}),
      ...(difficulty ? { difficulty } : {}),
      deletedAt: null,
    };

    const [series, total] = await Promise.all([
      prisma.examSeries.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { questions: true } },
          attempts: {
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true, score: true, percentage: true },
          },
        },
      }),
      prisma.examSeries.count({ where }),
    ]);

    return successResponse({
      series,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
