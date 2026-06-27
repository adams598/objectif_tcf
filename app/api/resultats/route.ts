import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { successResponse, serverErrorResponse } from "@/lib/utils/api-response";

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const attempts = await prisma.attempt.findMany({
      where: { userId: user.userId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 20,
      include: {
        series: { select: { title: true, skill: true, difficulty: true } },
        result: { select: { nclcLevel: true, globalScore: true, feedback: true } },
        answers: {
          include: {
            correction: {
              select: { score: true, feedback: true, status: true },
            },
          },
        },
      },
    });

    // Averages per skill
    const skillAverages: Record<string, number[]> = {};
    for (const attempt of attempts) {
      const skill = attempt.series.skill;
      if (!skillAverages[skill]) skillAverages[skill] = [];
      if (attempt.score !== null) skillAverages[skill].push(attempt.score);
    }

    const skillStats = Object.entries(skillAverages).map(([skill, scores]) => ({
      skill,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }));

    return successResponse({ attempts, skillStats });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
