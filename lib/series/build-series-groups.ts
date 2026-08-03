import type { ExamType, Skill } from "@prisma/client";
import { groupSeriesByOrder, type PublicSeriesItem } from "@/lib/preparation/series-groups";

export interface SeriesDiscipline {
  skill: Skill;
  seriesId: string;
  title: string;
  isFree: boolean;
  isAccessible: boolean;
  isLocked: boolean;
  durationMin: number;
  questionCount: number;
  /** Au moins une tentative COMPLETED */
  completed: boolean;
  /** Ouverte (IN_PROGRESS) sans COMPLETED */
  partial: boolean;
  score?: number;
  /** Dernière fois que l’apprenant a ouvert / joué cette discipline */
  lastOpenedAt?: string | null;
}

export interface SeriesGroup {
  order: number;
  title: string;
  isFree: boolean;
  isAccessible: boolean;
  isLocked: boolean;
  completedDisciplines: number;
  partialDisciplines: number;
  lastOpenedAt?: string | null;
  disciplines: SeriesDiscipline[];
}

interface FlatSeries {
  id: string;
  skill: Skill;
  title: string;
  durationMin: number;
  isFree: boolean;
  order: number;
  isAccessible: boolean;
  isLocked: boolean;
  _count: { questions: number };
  attempts: Array<{
    status: string;
    score: number | null;
    percentage: number | null;
    updatedAt?: string | Date;
    startedAt?: string | Date;
    completedAt?: string | Date | null;
  }>;
}

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function buildSeriesGroups(
  series: FlatSeries[],
  entitledExamTypes: Set<ExamType>,
  examType: ExamType,
  role?: string
): SeriesGroup[] {
  const hasEntitlement =
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    entitledExamTypes.has(examType);

  const items: PublicSeriesItem[] = series.map((s) => ({
    id: s.id,
    skill: s.skill,
    title: s.title,
    durationMin: s.durationMin,
    isFree: s.isFree,
    order: s.order,
    questionCount: s._count.questions,
  }));

  const baseGroups = groupSeriesByOrder(items);

  return baseGroups.map((group) => {
    const disciplines: SeriesDiscipline[] = group.disciplines.map((d) => {
      const flat = series.find((s) => s.id === d.seriesId);
      const attempts = flat?.attempts ?? [];
      const completed = attempts.some((a) => a.status === "COMPLETED");
      const partial =
        !completed && attempts.some((a) => a.status === "IN_PROGRESS");
      const completedAttempt = attempts.find((a) => a.status === "COMPLETED");
      const score = Math.round(
        completedAttempt?.percentage ?? completedAttempt?.score ?? 0
      );
      const lastOpenedAt = attempts.reduce<string | null>((max, a) => {
        const iso =
          toIso(a.updatedAt) ?? toIso(a.completedAt) ?? toIso(a.startedAt);
        if (!iso) return max;
        if (!max || iso > max) return iso;
        return max;
      }, null);

      const isAccessible = d.isFree || hasEntitlement;
      const isLocked = !isAccessible;

      return {
        skill: d.skill,
        seriesId: d.seriesId,
        title: flat?.title ?? group.title,
        isFree: d.isFree,
        isAccessible,
        isLocked,
        durationMin: d.durationMin,
        questionCount: d.questionCount,
        completed,
        partial,
        score: completed && score > 0 ? score : undefined,
        lastOpenedAt,
      };
    });

    const isFree = group.isFree;
    const isAccessible = isFree || hasEntitlement;
    const completedDisciplines = disciplines.filter((d) => d.completed).length;
    const partialDisciplines = disciplines.filter((d) => d.partial).length;
    const lastOpenedAt = disciplines.reduce<string | null>((max, d) => {
      if (!d.lastOpenedAt) return max;
      if (!max || d.lastOpenedAt > max) return d.lastOpenedAt;
      return max;
    }, null);

    return {
      order: group.order,
      title: group.title,
      isFree,
      isAccessible,
      isLocked: !isAccessible,
      completedDisciplines,
      partialDisciplines,
      lastOpenedAt,
      disciplines,
    };
  });
}
