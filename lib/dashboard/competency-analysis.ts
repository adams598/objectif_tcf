import type { Skill } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  ABBREV_TO_SKILL,
  DASHBOARD_SKILLS,
  SKILL_ABBREV,
  nclcLevelToNumber,
} from "@/lib/dashboard/stats";

export interface CompetencyScore {
  subject: string;
  score: number;
  target: number;
}

export interface SkillGap {
  subject: string;
  score: number;
  target: number;
  gap: number;
  attemptsCount: number;
  priority: "high" | "medium" | "low";
}

export async function computeCompetenciesFromAttempts(
  userId: string,
  target: number
): Promise<CompetencyScore[]> {
  const attempts = await prisma.attempt.findMany({
    where: {
      userId,
      status: "COMPLETED",
      nclcLevel: { not: null },
    },
    include: {
      series: { select: { skill: true } },
    },
    orderBy: { completedAt: "desc" },
    take: 200,
  });

  const bySkill: Record<string, number[]> = {};

  for (const attempt of attempts) {
    const abbrev = SKILL_ABBREV[attempt.series.skill as Skill];
    if (!DASHBOARD_SKILLS.includes(abbrev as (typeof DASHBOARD_SKILLS)[number])) {
      continue;
    }
    const nclc = nclcLevelToNumber(attempt.nclcLevel);
    if (nclc <= 0) continue;
    if (!bySkill[abbrev]) bySkill[abbrev] = [];
    bySkill[abbrev].push(nclc);
  }

  return DASHBOARD_SKILLS.map((subject) => {
    const scores = bySkill[subject] ?? [];
    const recent = scores.slice(0, 5);
    const average =
      recent.length > 0
        ? Math.round(
            (recent.reduce((sum, value) => sum + value, 0) / recent.length) * 10
          ) / 10
        : 0;

    return { subject, score: average, target };
  });
}

export function mergeCompetencyScores(
  fromProgress: CompetencyScore[],
  fromAttempts: CompetencyScore[]
): CompetencyScore[] {
  return DASHBOARD_SKILLS.map((subject) => {
    const progress = fromProgress.find((item) => item.subject === subject);
    const attempts = fromAttempts.find((item) => item.subject === subject);
    const score = Math.max(progress?.score ?? 0, attempts?.score ?? 0);
    return {
      subject,
      score,
      target: progress?.target ?? attempts?.target ?? 9,
    };
  });
}

export function buildSkillGaps(
  competencies: CompetencyScore[],
  attemptsBySkill: Record<string, number>
): SkillGap[] {
  return competencies
    .filter((item) => item.score > 0)
    .map((item) => {
      const gap = Math.max(0, Math.round((item.target - item.score) * 10) / 10);
      return {
        subject: item.subject,
        score: item.score,
        target: item.target,
        gap,
        attemptsCount: attemptsBySkill[item.subject] ?? 0,
        priority: gap >= 3 ? ("high" as const) : gap >= 1.5 ? ("medium" as const) : ("low" as const),
      };
    })
    .sort((a, b) => b.gap - a.gap);
}

export async function countAttemptsBySkill(userId: string) {
  const attempts = await prisma.attempt.findMany({
    where: { userId, status: "COMPLETED" },
    include: { series: { select: { skill: true } } },
  });

  const counts: Record<string, number> = {};
  for (const attempt of attempts) {
    const abbrev = SKILL_ABBREV[attempt.series.skill as Skill];
    if (!abbrev) continue;
    counts[abbrev] = (counts[abbrev] ?? 0) + 1;
  }
  return counts;
}

export function skillAbbrevToLabelKey(subject: string): "co" | "ce" | "ee" | "eo" {
  const map: Record<string, "co" | "ce" | "ee" | "eo"> = {
    CO: "co",
    CE: "ce",
    EE: "ee",
    EO: "eo",
  };
  return map[subject] ?? "co";
}

export { ABBREV_TO_SKILL };
