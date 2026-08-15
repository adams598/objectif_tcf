"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Gender, PaymentMethod } from "@prisma/client";
import { useTranslation } from "@/components/providers/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { AnalyticsPeriodType } from "@/lib/admin/analytics-period";
import { ALL_EXAM_TYPES, EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import { dateLocaleTag, type AppLocale } from "@/lib/i18n/locales";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { normalizeSelectedMonths } from "@/lib/admin/analytics-period";

export type AnalyticsFilterState = {
  examType: string;
  periodType: AnalyticsPeriodType;
  months: number;
  year: number;
  selectedMonths: number[];
  country: string;
  paymentMethod: string;
  gender: string;
  ageMin: string;
  ageMax: string;
  ageExact: string;
};

export type AnalyticsFilterOptions = {
  countries: string[];
  paymentMethods: PaymentMethod[];
  genders: Gender[];
  hasGenderData: boolean;
  hasAgeData: boolean;
  years: number[];
  currentYear: number;
};

function monthsShortLabels(locale: AppLocale): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    new Date(2000, i, 1).toLocaleDateString(dateLocaleTag(locale), {
      month: "short",
    })
  );
}

function paymentMethodLabel(
  method: string,
  t: (key: string) => string
): string {
  switch (method) {
    case "CARD":
      return t("admin.methodCard");
    case "MOBILE_MONEY":
      return t("admin.analyticsMobileMoney");
    case "MOBILE_MONEY_MTN":
      return "MTN";
    case "MOBILE_MONEY_ORANGE":
      return "Orange";
    case "MOBILE_MONEY_AIRTEL":
      return "Airtel";
    case "MOBILE_MONEY_WAVE":
      return "Wave";
    case "MOBILE_MONEY_MOOV":
      return "Moov";
    case "PAYPAL":
      return "PayPal";
    case "GOOGLE_PAY":
      return "Google Pay";
    case "BANK_TRANSFER":
      return t("admin.methodTransfer");
    case "SEPA":
      return "SEPA";
    case "UNKNOWN":
      return t("admin.analyticsUnknown");
    default:
      return method;
  }
}

const AGE_RANGES = [
  { key: "admin.analyticsAge18_24", min: 18, max: 24 },
  { key: "admin.analyticsAge25_34", min: 25, max: 34 },
  { key: "admin.analyticsAge35_44", min: 35, max: 44 },
  { key: "admin.analyticsAge45_54", min: 45, max: 54 },
  { key: "admin.analyticsAge55plus", min: 55, max: 120 },
] as const;

export function defaultAnalyticsFilters(currentYear: number): AnalyticsFilterState {
  const currentMonth = new Date().getMonth() + 1;
  return {
    examType: "ALL",
    periodType: "rolling",
    months: 6,
    year: currentYear,
    selectedMonths: [currentMonth],
    country: "ALL",
    paymentMethod: "ALL",
    gender: "ALL",
    ageMin: "",
    ageMax: "",
    ageExact: "",
  };
}

function formatSelectedMonthsLabel(
  year: number,
  months: number[],
  monthsShort: string[],
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const sorted = normalizeSelectedMonths(months);
  if (sorted.length === 0) return t("admin.analyticsChooseMonths");
  if (sorted.length === 1) {
    return `${monthsShort[sorted[0] - 1]} ${year}`;
  }
  const consecutive = sorted.every(
    (m, i) => i === 0 || m === sorted[i - 1] + 1
  );
  if (consecutive) {
    return `${monthsShort[sorted[0] - 1]}–${monthsShort[sorted[sorted.length - 1] - 1]} ${year}`;
  }
  return t("admin.analyticsNMonthsYear", { n: sorted.length, year });
}

function toggleMonth(months: number[], month: number): number[] {
  const set = new Set(months);
  if (set.has(month)) {
    set.delete(month);
  } else {
    set.add(month);
  }
  return normalizeSelectedMonths(Array.from(set));
}

export function buildAnalyticsQueryParams(
  filters: AnalyticsFilterState
): URLSearchParams {
  const params = new URLSearchParams({
    periodType: filters.periodType,
    months: String(filters.months),
    year: String(filters.year),
  });

  if (filters.examType !== "ALL") params.set("examType", filters.examType);
  if (filters.periodType === "custom" && filters.selectedMonths.length > 0) {
    params.set("selectedMonths", filters.selectedMonths.join(","));
  }
  if (filters.country !== "ALL") params.set("country", filters.country);
  if (filters.paymentMethod !== "ALL") {
    params.set("paymentMethod", filters.paymentMethod);
  }
  if (filters.gender !== "ALL") params.set("gender", filters.gender);
  if (filters.ageMin.trim()) params.set("ageMin", filters.ageMin.trim());
  if (filters.ageMax.trim()) params.set("ageMax", filters.ageMax.trim());
  if (filters.ageExact.trim()) params.set("ageExact", filters.ageExact.trim());

  return params;
}

function countActiveFilters(filters: AnalyticsFilterState): number {
  let n = 0;
  if (filters.examType !== "ALL") n++;
  if (filters.periodType === "custom") n++;
  else if (filters.periodType !== "rolling" || filters.months !== 6) n++;
  if (filters.country !== "ALL") n++;
  if (filters.paymentMethod !== "ALL") n++;
  if (filters.gender !== "ALL") n++;
  if (filters.ageMin || filters.ageMax || filters.ageExact) n++;
  return n;
}

function countryLabel(code: string, locale: AppLocale) {
  try {
    return (
      new Intl.DisplayNames(dateLocaleTag(locale), { type: "region" }).of(
        code
      ) ?? code
    );
  } catch {
    return code;
  }
}

const selectClass =
  "h-8 rounded-lg border border-outline-variant/70 bg-surface-container-lowest/80 px-2 pr-6 text-[11px] text-on-surface font-label-sm appearance-none cursor-pointer hover:border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary/40 shrink-0";

type FilterFieldProps = {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

function FilterField({
  label,
  value,
  onChange,
  children,
  className,
  disabled,
}: FilterFieldProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 shrink-0",
        disabled && "opacity-45 pointer-events-none",
        className
      )}
      data-filter-item
    >
      <span className="text-[10px] text-on-surface-variant/80 whitespace-nowrap hidden xl:inline">
        {label}
      </span>
      <select
        className={selectClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={label}
      >
        {children}
      </select>
    </label>
  );
}

type MonthSelectorProps = {
  year: number;
  selectedMonths: number[];
  onChange: (months: number[]) => void;
  layout: "inline" | "dialog";
  disabled?: boolean;
};

function MonthSelector({
  year,
  selectedMonths,
  onChange,
  layout,
  disabled,
}: MonthSelectorProps) {
  const { t, locale } = useTranslation();
  const monthsShort = monthsShortLabels(locale);
  const sorted = normalizeSelectedMonths(selectedMonths);
  const selectedLabel = formatSelectedMonthsLabel(
    year,
    sorted,
    monthsShort,
    t
  );

  const grid = (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      {monthsShort.map((name, index) => {
        const month = index + 1;
        const active = sorted.includes(month);
        return (
          <button
            key={month}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toggleMonth(sorted, month))}
            className={cn(
              "h-8 rounded-lg border text-[11px] font-label-sm transition-colors",
              active
                ? "border-primary bg-primary/15 text-primary"
                : "border-outline-variant/70 bg-surface hover:bg-surface-container-low text-on-surface-variant"
            )}
          >
            {name}
          </button>
        );
      })}
    </div>
  );

  const actions = (
    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-outline-variant/40 mt-2">
      <button
        type="button"
        disabled={disabled}
        className="h-7 px-2 rounded-md text-[10px] text-on-surface-variant hover:bg-surface-container-low"
        onClick={() => onChange(Array.from({ length: 12 }, (_, i) => i + 1))}
      >
        {t("admin.analyticsWholeYear")}
      </button>
      <button
        type="button"
        disabled={disabled}
        className="h-7 px-2 rounded-md text-[10px] text-on-surface-variant hover:bg-surface-container-low"
        onClick={() => onChange([])}
      >
        {t("admin.analyticsClear")}
      </button>
    </div>
  );

  if (layout === "dialog") {
    return (
      <div className="sm:col-span-2 space-y-2">
        <p className="text-[11px] font-label-sm text-on-surface-variant">
          {t("admin.analyticsMonthsInclude", { label: selectedLabel })}
        </p>
        {grid}
        {actions}
        {sorted.length === 0 && (
          <p className="text-[10px] text-error">
            {t("admin.analyticsNeedMonth")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 shrink-0",
        disabled && "opacity-45 pointer-events-none"
      )}
      data-filter-item
    >
      <span className="text-[10px] text-on-surface-variant/80 whitespace-nowrap hidden xl:inline">
        {t("admin.analyticsFilterMonths")}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(selectClass, "pr-2 min-w-[7.5rem] text-left")}
          >
            {selectedLabel}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-3">
          <p className="text-[11px] font-label-sm text-on-surface-variant mb-2">
            {t("admin.analyticsRangeYear", { year })}
          </p>
          {grid}
          {actions}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

type FilterControlsProps = {
  filters: AnalyticsFilterState;
  options: AnalyticsFilterOptions;
  onChange: (patch: Partial<AnalyticsFilterState>) => void;
  layout?: "inline" | "dialog";
  limit?: number;
};

function FilterControls({
  filters,
  options,
  onChange,
  layout = "inline",
  limit,
}: FilterControlsProps) {
  const { t, locale } = useTranslation();
  const yearDisabled = filters.periodType === "rolling";
  const customDisabled = filters.periodType !== "custom";

  const genderLabels: Record<Gender, string> = {
    MALE: t("admin.analyticsGenderMale"),
    FEMALE: t("admin.analyticsGenderFemale"),
    OTHER: t("admin.analyticsGenderOther"),
    UNSPECIFIED: t("admin.analyticsGenderUnspecified"),
  };

  let fieldIndex = 0;
  const show = (node: React.ReactNode) => {
    const idx = fieldIndex++;
    if (limit != null && idx >= limit) return null;
    return node;
  };

  const years =
    options.years.length > 0
      ? options.years
      : [options.currentYear];

  const fields = (
    <>
      {show(
      <FilterField
        label={t("admin.analyticsFilterExam")}
        value={filters.examType}
        onChange={(v) => onChange({ examType: v })}
      >
        <option value="ALL">{t("admin.analyticsFilterAllExams")}</option>
        {ALL_EXAM_TYPES.map((type) => (
          <option key={type} value={type}>
            {type === "AUTRE"
              ? t("admin.analyticsExamOther")
              : EXAM_TYPE_LABELS[type]}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterPeriod")}
        value={
          filters.periodType === "rolling"
            ? `rolling:${filters.months}`
            : filters.periodType
        }
        onChange={(v) => {
          if (v.startsWith("rolling:")) {
            onChange({
              periodType: "rolling",
              months: parseInt(v.split(":")[1] ?? "6", 10),
            });
          } else if (v === "custom") {
            onChange({
              periodType: "custom",
              selectedMonths:
                filters.selectedMonths.length > 0
                  ? filters.selectedMonths
                  : [new Date().getMonth() + 1],
            });
          } else {
            onChange({ periodType: v as AnalyticsPeriodType });
          }
        }}
      >
        <option value="rolling:3">{t("admin.analyticsFilterLast3")}</option>
        <option value="rolling:6">{t("admin.analyticsFilterLast6")}</option>
        <option value="rolling:12">{t("admin.analyticsFilterLast12")}</option>
        <option value="year">{t("admin.analyticsFilterFullYear")}</option>
        <option value="custom">{t("admin.analyticsFilterMonthRange")}</option>
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterYear")}
        value={filters.year}
        onChange={(v) => onChange({ year: parseInt(v, 10) })}
        disabled={yearDisabled}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <MonthSelector
        year={filters.year}
        selectedMonths={filters.selectedMonths}
        onChange={(selectedMonths) => onChange({ selectedMonths })}
        layout={layout}
        disabled={customDisabled}
      />
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterCountry")}
        value={filters.country}
        onChange={(v) => onChange({ country: v })}
      >
        <option value="ALL">{t("admin.analyticsFilterAllCountries")}</option>
        {options.countries.map((c) => (
          <option key={c} value={c}>
            {countryLabel(c, locale)}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterPayment")}
        value={filters.paymentMethod}
        onChange={(v) => onChange({ paymentMethod: v })}
      >
        <option value="ALL">{t("admin.analyticsFilterAllMethods")}</option>
        {options.paymentMethods.map((m) => (
          <option key={m} value={m}>
            {paymentMethodLabel(m, t)}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterGender")}
        value={filters.gender}
        onChange={(v) => onChange({ gender: v })}
        disabled={!options.hasGenderData}
      >
        <option value="ALL">
          {options.hasGenderData
            ? t("admin.all")
            : t("admin.analyticsUnavailable")}
        </option>
        {options.genders.map((g) => (
          <option key={g} value={g}>
            {genderLabels[g]}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterAgeRange")}
        value={
          filters.ageMin && filters.ageMax && !filters.ageExact
            ? `${filters.ageMin}-${filters.ageMax}`
            : ""
        }
        onChange={(v) => {
          if (!v) {
            onChange({ ageMin: "", ageMax: "", ageExact: "" });
            return;
          }
          const range = AGE_RANGES.find(
            (r) => `${r.min}-${r.max}` === v
          );
          if (range) {
            onChange({
              ageMin: String(range.min),
              ageMax: String(range.max),
              ageExact: "",
            });
          }
        }}
        disabled={!options.hasAgeData}
      >
        <option value="">
          {options.hasAgeData
            ? t("admin.analyticsFilterAllAgeRanges")
            : t("admin.analyticsUnavailable")}
        </option>
        {AGE_RANGES.map((r) => (
          <option key={r.key} value={`${r.min}-${r.max}`}>
            {t(r.key)}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label={t("admin.analyticsFilterAge")}
        value={filters.ageExact}
        onChange={(v) =>
          onChange({
            ageExact: v,
            ageMin: v ? "" : filters.ageMin,
            ageMax: v ? "" : filters.ageMax,
          })
        }
        disabled={!options.hasAgeData}
      >
        <option value="">
          {options.hasAgeData ? t("admin.analyticsFilterAllAges") : "—"}
        </option>
        {options.hasAgeData &&
          Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
            <option key={age} value={age}>
              {t("admin.analyticsAgeYears", { n: age })}
            </option>
          ))}
      </FilterField>
      )}
    </>
  );

  if (layout === "dialog") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">{fields}</div>
    );
  }

  return <>{fields}</>;
}

type AdminAnalyticsFiltersProps = {
  filters: AnalyticsFilterState;
  options: AnalyticsFilterOptions;
  onChange: (patch: Partial<AnalyticsFilterState>) => void;
};

export function AdminAnalyticsFilters({
  filters,
  options,
  onChange,
}: AdminAnalyticsFiltersProps) {
  const { t } = useTranslation();
  const barRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [overflowCount, setOverflowCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const checkOverflow = useCallback(() => {
    const bar = barRef.current;
    const measure = measureRef.current;
    if (!bar || !measure) return;

    const items = measure.querySelectorAll("[data-filter-item]");
    const barWidth = bar.clientWidth - 88;
    let used = 0;
    let visible = 0;

    items.forEach((el) => {
      const w = (el as HTMLElement).offsetWidth + 6;
      if (used + w <= barWidth) {
        used += w;
        visible += 1;
      }
    });

    const total = items.length;
    setVisibleCount(visible);
    setOverflowCount(Math.max(0, total - visible));
  }, []);

  useEffect(() => {
    checkOverflow();
    const ro = new ResizeObserver(checkOverflow);
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [checkOverflow, filters, options]);

  const resetFilters = () => {
    onChange(defaultAnalyticsFilters(options.currentYear));
    setDialogOpen(false);
  };

  return (
    <div className="relative">
      <div
        ref={measureRef}
        className="absolute invisible pointer-events-none flex gap-1.5 whitespace-nowrap -z-10"
        aria-hidden
      >
        <FilterControls
          filters={filters}
          options={options}
          onChange={onChange}
        />
      </div>

      <div
        ref={barRef}
        className="flex items-center gap-1.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest/50 px-2 py-1.5"
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden">
          <FilterControls
            filters={filters}
            options={options}
            onChange={onChange}
            limit={overflowCount > 0 ? visibleCount : undefined}
          />
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className={cn(
                "h-8 shrink-0 rounded-lg border px-2.5 text-[11px] font-label-sm whitespace-nowrap",
                "border-outline-variant/70 bg-surface hover:bg-surface-container-low",
                activeCount > 0 && "border-primary/40 text-primary"
              )}
            >
              {overflowCount > 0
                ? t("admin.analyticsFiltersMore")
                : t("admin.analyticsFilters")}
              {(activeCount > 0 || overflowCount > 0) && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px]">
                  {activeCount > 0 ? activeCount : "…"}
                </span>
              )}
            </button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("admin.analyticsFiltersTitle")}</DialogTitle>
              </DialogHeader>
              <FilterControls
                filters={filters}
                options={options}
                onChange={onChange}
                layout="dialog"
              />
              <div className="flex justify-end gap-sm pt-md border-t border-outline-variant/50">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="h-9 px-4 rounded-lg text-[12px] text-on-surface-variant hover:bg-surface-container-low"
                >
                  {t("admin.analyticsReset")}
                </button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-9 px-4 rounded-lg bg-primary text-on-primary text-[12px] font-label-sm"
                >
                  {t("admin.analyticsApply")}
                </button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}
