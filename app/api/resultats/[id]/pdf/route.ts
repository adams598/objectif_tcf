import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";
import { percentageToCecr } from "@/lib/examen/scoring";
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

    const pct = Math.round(attempt.percentage ?? 0);
    const nclc = attempt.nclcLevel
      ? `NCLC ${nclcLevelToNumber(attempt.nclcLevel)}`
      : "—";
    const studentName =
      [attempt.user.firstName, attempt.user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || attempt.user.name;

    const pdfBytes = await generateResultPdf({
      title: attempt.series.title,
      studentName,
      completedAt: attempt.completedAt
        ? new Date(attempt.completedAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "—",
      skill: SKILL_LABELS[attempt.series.skill] ?? attempt.series.skill,
      percentage: pct,
      cecrLevel: percentageToCecr(pct),
      nclcLevel: nclc,
      durationMinutes: Math.max(1, Math.floor((attempt.durationSec ?? 0) / 60)),
      skillScores,
      corrections,
    });

    const safeTitle = attempt.series.title
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .slice(0, 40);
    const filename = `resultat-${safeTitle || id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
