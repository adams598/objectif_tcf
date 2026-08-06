import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  EXAM_TAB_TO_TYPE,
  type ExamTab,
} from "@/lib/pricing/constants";
import { resolveExamTypeFromQuery } from "@/lib/exams/catalog";
import { getActiveExamEntitlements } from "@/lib/subscriptions/access";
import { buildSeriesGroups } from "@/lib/series/build-series-groups";
import { computeSkillReadinessAverages } from "@/lib/series/skill-readiness";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

const querySchema = z.object({
  examen: z.string().optional(),
  examType: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { examen, examType: examTypeParam } = parsed.data;
    const examType =
      resolveExamTypeFromQuery(examen, examTypeParam) ?? EXAM_TAB_TO_TYPE.tcf;

    const entitlements = await getActiveExamEntitlements(user.userId);
    const entitledExamTypes = new Set(entitlements.map((e) => e.examType));

    const series = await prisma.examSeries.findMany({
      where: {
        exam: { type: examType, isActive: true, deletedAt: null },
        isPublished: true,
        deletedAt: null,
        skill: {
          in: [
            "COMPREHENSION_ORALE",
            "COMPREHENSION_ECRITE",
            "EXPRESSION_ECRITE",
            "EXPRESSION_ORALE",
          ],
        },
      },
      orderBy: [{ order: "asc" }, { skill: "asc" }],
      include: {
        exam: { select: { type: true, title: true } },
        _count: { select: { questions: true } },
        attempts: {
          where: { userId: user.userId },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            status: true,
            score: true,
            percentage: true,
            updatedAt: true,
            startedAt: true,
            completedAt: true,
          },
        },
      },
    });

    const mapped = series.map((item) => {
      const hasAccess =
        item.isFree ||
        user.role === "ADMIN" ||
        user.role === "SUPER_ADMIN" ||
        entitledExamTypes.has(item.exam.type);

      return {
        ...item,
        isAccessible: hasAccess,
        isLocked: !hasAccess,
      };
    });

    const groups = buildSeriesGroups(
      mapped,
      entitledExamTypes,
      examType,
      user.role
    );

    const completedAttempts = await prisma.attempt.findMany({
      where: {
        userId: user.userId,
        status: "COMPLETED",
        series: {
          exam: { type: examType, isActive: true, deletedAt: null },
          deletedAt: null,
          skill: {
            in: [
              "COMPREHENSION_ORALE",
              "COMPREHENSION_ECRITE",
              "EXPRESSION_ECRITE",
              "EXPRESSION_ORALE",
            ],
          },
        },
      },
      select: {
        percentage: true,
        score: true,
        maxScore: true,
        series: { select: { skill: true } },
      },
    });

    const skillReadiness = computeSkillReadinessAverages(
      completedAttempts.map((attempt) => ({
        percentage: attempt.percentage,
        score: attempt.score,
        maxScore: attempt.maxScore,
        skill: attempt.series.skill,
      }))
    );

    return successResponse({
      groups,
      series: mapped,
      entitlements,
      skillReadiness,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
