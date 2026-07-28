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
import { cn } from "@/lib/utils";

export type AnalyticsFilterState = {
  examType: string;
  periodType: AnalyticsPeriodType;
  months: number;
  year: number;
  month: number;
  monthPairStart: number;
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

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

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
  return {
    examType: "ALL",
    periodType: "rolling",
    months: 6,
    year: currentYear,
    month: 1,
    monthPairStart: 1,
    country: "ALL",
    paymentMethod: "ALL",
    gender: "ALL",
    ageMin: "",
    ageMax: "",
    ageExact: "",
  };
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
  if (filters.periodType === "month") {
    params.set("month", String(filters.month));
  }
  if (filters.periodType === "monthPair") {
    params.set("monthPairStart", String(filters.monthPairStart));
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
  if (filters.periodType !== "rolling" || filters.months !== 6) n++;
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
  const pairDisabled = filters.periodType !== "monthPair";

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
          } else {
            onChange({ periodType: v as AnalyticsPeriodType });
          }
        }}
      >
        <option value="rolling:3">3 derniers mois</option>
        <option value="rolling:6">6 derniers mois</option>
        <option value="rolling:12">12 derniers mois</option>
        <option value="year">Année entière</option>
        <option value="month">Mois précis</option>
        <option value="monthPair">2 mois consécutifs</option>
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
      <FilterField
        label="Mois"
        value={filters.month}
        onChange={(v) => onChange({ month: parseInt(v, 10) })}
        disabled={filters.periodType !== "month"}
      >
        {MONTHS_FR.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </FilterField>
      )}

      {show(
      <FilterField
        label="2 mois"
        value={filters.monthPairStart}
        onChange={(v) => onChange({ monthPairStart: parseInt(v, 10) })}
        disabled={pairDisabled}
      >
        {MONTHS_SHORT.slice(0, 11).map((name, i) => (
          <option key={name} value={i + 1}>
            {name}–{MONTHS_SHORT[i + 1]}
          </option>
        ))}
      </FilterField>
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
