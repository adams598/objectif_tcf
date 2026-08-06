import type { Skill } from "@prisma/client";

export const SERIES_SKILLS: Skill[] = [
  "COMPREHENSION_ORALE",
  "COMPREHENSION_ECRITE",
  "EXPRESSION_ECRITE",
  "EXPRESSION_ORALE",
];

export type SkillReadinessMap = Partial<Record<Skill, number>>;

interface AttemptPercentInput {
  percentage: number | null;
  score: number | null;
  maxScore: number | null;
}

export function getAttemptSuccessPercent(
  attempt: AttemptPercentInput
): number | null {
  if (attempt.percentage != null && !Number.isNaN(attempt.percentage)) {
    return Math.max(0, Math.min(100, attempt.percentage));
  }
  if (
    attempt.score != null &&
    attempt.maxScore != null &&
    attempt.maxScore > 0
  ) {
    return Math.max(
      0,
      Math.min(100, (attempt.score / attempt.maxScore) * 100)
    );
  }
  return null;
}

export function computeSkillReadinessAverages(
  attempts: Array<AttemptPercentInput & { skill: Skill }>
): SkillReadinessMap {
  const buckets: Partial<Record<Skill, number[]>> = {};

  for (const attempt of attempts) {
    const percent = getAttemptSuccessPercent(attempt);
    if (percent == null) continue;
    if (!buckets[attempt.skill]) buckets[attempt.skill] = [];
    buckets[attempt.skill]!.push(percent);
  }

  const result: SkillReadinessMap = {};
  for (const skill of SERIES_SKILLS) {
    const values = buckets[skill];
    if (!values?.length) continue;
    const avg =
      values.reduce((sum, value) => sum + value, 0) / values.length;
    result[skill] = Math.round(avg * 10) / 10;
  }

  return result;
}

export interface ReadinessFillStyle {
  widthPercent: number;
  fillClass: string;
  contentClass: string;
}

/** 0–39 % → barre rouge à 39 % ; 40–75 % → orange ; 76–100 % → vert plein. */
export function getReadinessFillStyle(
  averagePercent: number
): ReadinessFillStyle {
  const value = Math.max(0, Math.min(100, averagePercent));

  if (value <= 39) {
    return {
      widthPercent: 39,
      fillClass: "bg-error/35",
      contentClass: "text-error",
    };
  }

  if (value <= 75) {
    return {
      widthPercent: value,
      fillClass: "bg-tertiary/45",
      contentClass: "text-on-surface",
    };
  }

  return {
    widthPercent: 100,
    fillClass: "bg-success/40",
    contentClass: "text-success",
  };
}
