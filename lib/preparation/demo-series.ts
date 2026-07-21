import type { ExamTab } from "@/lib/pricing/constants";
import {
  FREE_SERIES_ORDERS,
  PREMIUM_SERIES_ORDERS,
} from "@/lib/preparation/series-catalog";
import { getDemoSeriesId } from "./constants";

import type { PublicSeriesGroup } from "@/lib/preparation/series-groups";

export type { PublicSeriesGroup };

function buildDemoGroup(order: number, isFree: boolean): PublicSeriesGroup {
  const skills = [
    "COMPREHENSION_ECRITE",
    "COMPREHENSION_ORALE",
    "EXPRESSION_ECRITE",
    "EXPRESSION_ORALE",
  ] as const;

  return {
    order,
    title: `Série ${order}`,
    isFree,
    disciplines: skills.map((skill) => ({
      skill,
      seriesId: getDemoSeriesId(skill, order),
      isFree,
      durationMin:
        skill === "COMPREHENSION_ORALE"
          ? 40
          : skill === "EXPRESSION_ORALE"
            ? 12
            : 60,
      questionCount:
        skill === "EXPRESSION_ECRITE" || skill === "EXPRESSION_ORALE" ? 3 : 39,
    })),
  };
}

export function getDemoSeriesGroups(_exam: ExamTab): PublicSeriesGroup[] {
  return [
    ...FREE_SERIES_ORDERS.map((order) => buildDemoGroup(order, true)),
    ...PREMIUM_SERIES_ORDERS.map((order) => buildDemoGroup(order, false)),
  ];
}
