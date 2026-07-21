import type { Skill } from "@prisma/client";

export interface PublicSeriesItem {
  id: string;
  skill: Skill;
  title: string;
  durationMin: number;
  isFree: boolean;
  order: number;
  questionCount: number;
}

export interface PublicSeriesGroup {
  order: number;
  title: string;
  isFree: boolean;
  disciplines: Array<{
    skill: Skill;
    seriesId: string;
    isFree: boolean;
    durationMin: number;
    questionCount: number;
  }>;
}

export function groupSeriesByOrder(series: PublicSeriesItem[]): PublicSeriesGroup[] {
  const map = new Map<number, PublicSeriesItem[]>();

  for (const item of series) {
    const existing = map.get(item.order) ?? [];
    existing.push(item);
    map.set(item.order, existing);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([order, items]) => {
      const title =
        items.find((s) => s.title.match(/série\s+\d+/i))?.title ??
        `Série ${order}`;

      const displayTitle = title.match(/série\s+\d+/i)?.[0] ?? `Série ${order}`;

      return {
        order,
        title: displayTitle.charAt(0).toUpperCase() + displayTitle.slice(1),
        isFree: items.every((s) => s.isFree),
        disciplines: items.map((s) => ({
          skill: s.skill,
          seriesId: s.id,
          isFree: s.isFree,
          durationMin: s.durationMin,
          questionCount: s.questionCount,
        })),
      };
    });
}
