"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/locale-provider";

interface QuestionMapProps {
  total: number;
  current: number;
  answered: Set<number>;
  onSelect: (index: number) => void;
  startNumber?: number;
}

export function QuestionMap({
  total,
  current,
  answered,
  onSelect,
  startNumber = 1,
}: QuestionMapProps) {
  const { t } = useTranslation();

  return (
    <div className="pr-3 pl-1">
      <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs font-bold uppercase tracking-wide">
        {t("exam.questions")}
      </p>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: total }, (_, i) => {
          const num = startNumber + i;
          const isCurrent = i === current;
          const isAnswered = answered.has(i);

          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "aspect-square w-full flex items-center justify-center text-[11px] leading-none font-bold transition-colors",
                isCurrent
                  ? "bg-primary text-on-primary shadow-violet-sm"
                  : isAnswered
                    ? "bg-success-container text-success hover:opacity-90"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}
