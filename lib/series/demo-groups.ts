import type { PublicSeriesGroup } from "@/lib/preparation/series-groups";
import type { SeriesGroup } from "@/lib/series/build-series-groups";

export function demoGroupsToSeriesGroups(
  groups: PublicSeriesGroup[]
): SeriesGroup[] {
  return groups.map((group) => {
    const disciplines = group.disciplines.map((d) => ({
      skill: d.skill,
      seriesId: d.seriesId,
      title: group.title,
      isFree: d.isFree,
      isAccessible: d.isFree,
      isLocked: !d.isFree,
      durationMin: d.durationMin,
      questionCount: d.questionCount,
      completed: false,
      partial: false,
      lastOpenedAt: null as string | null,
    }));

    return {
      order: group.order,
      title: group.title,
      isFree: group.isFree,
      isAccessible: group.isFree,
      isLocked: !group.isFree,
      completedDisciplines: 0,
      partialDisciplines: 0,
      lastOpenedAt: null,
      disciplines,
    };
  });
}
