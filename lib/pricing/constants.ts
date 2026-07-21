import type { ExamType } from "@prisma/client";

export type ExamTab = "tcf" | "tef" | "ielts";

export const EXAM_TAB_LABELS: Record<ExamTab, string> = {
  tcf: "Examen TCF",
  tef: "Examen TEF",
  ielts: "Examen IELTS",
};

export const EXAM_TAB_TO_TYPE: Record<ExamTab, ExamType> = {
  tcf: "TCF_CANADA",
  tef: "TEF_CANADA",
  ielts: "IELTS",
};

export const EXAM_TYPE_TO_TAB: Partial<Record<ExamType, ExamTab>> = {
  TCF_CANADA: "tcf",
  TEF_CANADA: "tef",
  IELTS: "ielts",
};

export interface OfferFeature {
  label: string;
  included: boolean;
}

export interface PricingOffer {
  id: string;
  examType: ExamType;
  name: string;
  slug: string;
  subtitle: string | null;
  priceXaf: number;
  priceUsd: number;
  priceXof: number;
  baseDays: number;
  bonusDays: number;
  totalDays: number;
  features: OfferFeature[];
  sortOrder: number;
}

export interface PricingConfig {
  examType: ExamType;
  pricePerDayXaf: number;
  pricePerDayUsd: number;
  pricePerDayXof: number;
}

export const MIN_PREPARATION_DAYS = 15;
export const MAX_PREPARATION_DAYS = 365;

export function isValidPreparationDays(days: number): boolean {
  return (
    Number.isInteger(days) &&
    days >= MIN_PREPARATION_DAYS &&
    days <= MAX_PREPARATION_DAYS
  );
}

export function parseExamTab(value: string | null | undefined): ExamTab {
  if (value === "tef" || value === "ielts") return value;
  return "tcf";
}

export function calculateDynamicPrice(days: number, config: PricingConfig) {
  const safeDays = Math.max(MIN_PREPARATION_DAYS, days);
  return {
    days: safeDays,
    priceXaf: safeDays * config.pricePerDayXaf,
    priceUsd: safeDays * config.pricePerDayUsd,
    priceXof: safeDays * config.pricePerDayXof,
  };
}

export function formatPrice(amount: number, currency: "xaf" | "usd" | "xof"): string {
  if (currency === "usd") {
    return `${amount.toLocaleString("fr-CA")} USD`;
  }
  if (currency === "xaf") {
    return `${amount.toLocaleString("fr-CA")} F CFA`;
  }
  return `${amount.toLocaleString("fr-CA")} XOF`;
}

export function formatPricePair(priceXaf: number, priceUsd: number): string {
  return `${formatPrice(priceXaf, "xaf")} / ${formatPrice(priceUsd, "usd")}`;
}

export function getExamDateFromDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function formatExamDate(date: Date): string {
  const day = date.getDate();
  const month = date.toLocaleDateString("fr-FR", { month: "long" });
  return `${day} ${month}`;
}
