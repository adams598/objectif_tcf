import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";
import { generateResultPdf } from "@/lib/pdf/generate-documents";
import {
  notFoundResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

const SKILL_LABELS: Record<string, string> = {
  COMPREHENSION_ORALE: "Compréhension orale",
  COMPREHENSION_ECRITE: "Compréhension écrite",
  EXPRESSION_ECRITE: "Expression écrite",
  EXPRESSION_ORALE: "Expression orale",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const attempt = await prisma.attempt.findFirst({
      where: { id, userId: user.userId, status: "COMPLETED" },
      include: {
        series: { select: { title: true, skill: true } },
        answers: {
          include: {
            correction: { select: { feedback: true } },
          },
        },
        user: { select: { name: true, firstName: true, lastName: true } },
      },
    });

    if (!attempt) return notFoundResponse("Résultat");

    const allAttempts = await prisma.attempt.findMany({
      where: { userId: user.userId, status: "COMPLETED" },
      include: { series: { select: { skill: true } } },
    });

    const skillAverages: Record<string, number[]> = {};
    for (const a of allAttempts) {
      const skill = a.series.skill;
      if (!skillAverages[skill]) skillAverages[skill] = [];
      if (a.percentage != null) skillAverages[skill].push(a.percentage);
    }

    const skillScores = Object.entries(skillAverages).map(([skill, scores]) => ({
      label: SKILL_LABELS[skill] ?? skill,
      value: `${Math.round(scores.reduce((x, y) => x + y, 0) / scores.length)}%`,
    }));

    const corrections = attempt.answers
      .map((a) => a.correction?.feedback)
      .filter(Boolean) as string[];

    const nclc = attempt.nclcLevel
      ? `NCLC ${nclcLevelToNumber(attempt.nclcLevel)}`
      : "—";

    const pdfBytes = await generateResultPdf({
      title: attempt.series.title,
      studentName: attempt.user.name,
      completedAt: attempt.completedAt
        ? new Date(attempt.completedAt).toLocaleDateString("fr-FR")
        : "—",
      skill: SKILL_LABELS[attempt.series.skill] ?? attempt.series.skill,
      percentage: Math.round(attempt.percentage ?? 0),
      nclcLevel: nclc,
      durationMinutes: Math.max(1, Math.floor((attempt.durationSec ?? 0) / 60)),
      skillScores,
      corrections,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="resultat-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
