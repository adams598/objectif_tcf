import {
  FREE_SERIES_ORDERS,
  PREMIUM_SERIES_ORDERS,
} from "@/lib/preparation/series-catalog";
import type { BankQuestion, BankSeries } from "./tcf-canada";

export function expandQcm(base: BankQuestion[], targetCount: number): BankQuestion[] {
  const result: BankQuestion[] = [];
  for (let i = 0; i < targetCount; i++) {
    const src = base[i % base.length];
    result.push({
      ...src,
      order: i + 1,
      content: i < base.length ? src.content : `${src.content} (Q${i + 1})`,
    });
  }
  return result;
}

export function buildExamBankSeries(
  baseSeries: BankSeries[],
  options?: { premiumCount?: number }
): BankSeries[] {
  const premiumOrders =
    options?.premiumCount != null
      ? PREMIUM_SERIES_ORDERS.slice(0, options.premiumCount)
      : PREMIUM_SERIES_ORDERS;

  const freeSeries = FREE_SERIES_ORDERS.flatMap((order) =>
    baseSeries.map((s) => ({
      ...s,
      order,
      title: s.title.replace("100", String(order)),
      questions: s.questions.map((q) => ({ ...q, order: q.order })),
    }))
  );

  const premium = premiumOrders.flatMap((order) =>
    baseSeries.map((s) => ({
      ...s,
      order,
      title: s.title.replace("100", String(order)),
      isFree: false,
      questions: s.questions.map((q, index) => ({
        ...q,
        order: index + 1,
        content:
          order > 101 && q.type === "QCM"
            ? `${q.content} (série ${order})`
            : q.content,
      })),
    }))
  );

  return [...freeSeries, ...premium];
}
