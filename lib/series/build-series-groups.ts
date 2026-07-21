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
  completed: boolean;
  score?: number;
}

export interface SeriesGroup {
  order: number;
  title: string;
  isFree: boolean;
  isAccessible: boolean;
  isLocked: boolean;
  completedDisciplines: number;
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
  }>;
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
      const lastAttempt = flat?.attempts[0];
      const completed = lastAttempt?.status === "COMPLETED";
      const score = Math.round(
        lastAttempt?.percentage ?? lastAttempt?.score ?? 0
      );
      const isAccessible =
        d.isFree || hasEntitlement;
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
        score: completed && score > 0 ? score : undefined,
      };
    });

    const isFree = group.isFree;
    const isAccessible = isFree || hasEntitlement;
    const completedDisciplines = disciplines.filter((d) => d.completed).length;

    return {
      order: group.order,
      title: group.title,
      isFree,
      isAccessible,
      isLocked: !isAccessible,
      completedDisciplines,
      disciplines,
    };
  });
}
