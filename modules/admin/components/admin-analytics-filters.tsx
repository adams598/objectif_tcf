"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Gender, PaymentMethod } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { GENDER_LABELS } from "@/lib/admin/analytics";
import type { AnalyticsPeriodType } from "@/lib/admin/analytics-period";
import { ALL_EXAM_TYPES, EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
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

const MONTHS_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const METHOD_LABELS: Record<string, string> = {
  CARD: "Carte",
  MOBILE_MONEY: "Mobile money",
  MOBILE_MONEY_MTN: "MTN",
  MOBILE_MONEY_ORANGE: "Orange",
  MOBILE_MONEY_AIRTEL: "Airtel",
  MOBILE_MONEY_WAVE: "Wave",
  MOBILE_MONEY_MOOV: "Moov",
  PAYPAL: "PayPal",
  GOOGLE_PAY: "Google Pay",
  BANK_TRANSFER: "Virement",
  SEPA: "SEPA",
  UNKNOWN: "Inconnu",
};

const AGE_RANGES = [
  { label: "18-24 ans", min: 18, max: 24 },
  { label: "25-34 ans", min: 25, max: 34 },
  { label: "35-44 ans", min: 35, max: 44 },
  { label: "45-54 ans", min: 45, max: 54 },
  { label: "55+ ans", min: 55, max: 120 },
];

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

function formatSelectedMonthsLabel(year: number, months: number[]): string {
  const sorted = normalizeSelectedMonths(months);
  if (sorted.length === 0) return "Choisir les mois";
  if (sorted.length === 1) {
    return `${MONTHS_SHORT[sorted[0] - 1]} ${year}`;
  }
  const consecutive = sorted.every(
    (m, i) => i === 0 || m === sorted[i - 1] + 1
  );
  if (consecutive) {
    return `${MONTHS_SHORT[sorted[0] - 1]}–${MONTHS_SHORT[sorted[sorted.length - 1] - 1]} ${year}`;
  }
  return `${sorted.length} mois · ${year}`;
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

function countryLabel(code: string) {
  try {
    return new Intl.DisplayNames("fr", { type: "region" }).of(code) ?? code;
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
  const sorted = normalizeSelectedMonths(selectedMonths);

  const grid = (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
      {MONTHS_SHORT.map((name, index) => {
        const month = index + 1;
        const active = sorted.includes(month);
        return (
          <button
            key={name}
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
        Toute l&apos;année
      </button>
      <button
        type="button"
        disabled={disabled}
        className="h-7 px-2 rounded-md text-[10px] text-on-surface-variant hover:bg-surface-container-low"
        onClick={() => onChange([])}
      >
        Effacer
      </button>
    </div>
  );

  if (layout === "dialog") {
    return (
      <div className="sm:col-span-2 space-y-2">
        <p className="text-[11px] font-label-sm text-on-surface-variant">
          Mois à inclure ({formatSelectedMonthsLabel(year, sorted)})
        </p>
        {grid}
        {actions}
        {sorted.length === 0 && (
          <p className="text-[10px] text-error">
            Sélectionnez au moins un mois pour la plage personnalisée.
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
        Mois
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(selectClass, "pr-2 min-w-[7.5rem] text-left")}
          >
            {formatSelectedMonthsLabel(year, sorted)}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-3">
          <p className="text-[11px] font-label-sm text-on-surface-variant mb-2">
            Plage · {year}
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
  const yearDisabled = filters.periodType === "rolling";
  const customDisabled = filters.periodType !== "custom";

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
        label="Examen"
        value={filters.examType}
        onChange={(v) => onChange({ examType: v })}
      >
        <option value="ALL">Tous examens</option>
        {ALL_EXAM_TYPES.map((type) => (
          <option key={type} value={type}>
            {EXAM_TYPE_LABELS[type]}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="Période"
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
        <option value="rolling:3">3 derniers mois</option>
        <option value="rolling:6">6 derniers mois</option>
        <option value="rolling:12">12 derniers mois</option>
        <option value="year">Année entière</option>
        <option value="custom">Plage de mois</option>
      </FilterField>
      )}

      {show(
      <FilterField
        label="Année"
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
        label="Pays"
        value={filters.country}
        onChange={(v) => onChange({ country: v })}
      >
        <option value="ALL">Tous pays</option>
        {options.countries.map((c) => (
          <option key={c} value={c}>
            {countryLabel(c)}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="Paiement"
        value={filters.paymentMethod}
        onChange={(v) => onChange({ paymentMethod: v })}
      >
        <option value="ALL">Tous modes</option>
        {options.paymentMethods.map((m) => (
          <option key={m} value={m}>
            {METHOD_LABELS[m] ?? m}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="Sexe"
        value={filters.gender}
        onChange={(v) => onChange({ gender: v })}
        disabled={!options.hasGenderData}
      >
        <option value="ALL">
          {options.hasGenderData ? "Tous" : "Non disponible"}
        </option>
        {options.genders.map((g) => (
          <option key={g} value={g}>
            {GENDER_LABELS[g]}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="Tranche âge"
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
          {options.hasAgeData ? "Toutes tranches" : "Non disponible"}
        </option>
        {AGE_RANGES.map((r) => (
          <option key={r.label} value={`${r.min}-${r.max}`}>
            {r.label}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="Âge"
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
          {options.hasAgeData ? "Tous âges" : "—"}
        </option>
        {options.hasAgeData &&
          Array.from({ length: 63 }, (_, i) => i + 18).map((age) => (
            <option key={age} value={age}>
              {age} ans
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
              {overflowCount > 0 ? "＋ Filtres" : "Filtres"}
              {(activeCount > 0 || overflowCount > 0) && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary/15 px-1 text-[10px]">
                  {activeCount > 0 ? activeCount : "…"}
                </span>
              )}
            </button>
          </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filtres statistiques</DialogTitle>
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
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-9 px-4 rounded-lg bg-primary text-on-primary text-[12px] font-label-sm"
                >
                  Appliquer
                </button>
              </div>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}
