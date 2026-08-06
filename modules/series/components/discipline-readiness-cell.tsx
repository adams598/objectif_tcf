"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  getReadinessFillStyle,
  type SkillReadinessMap,
} from "@/lib/series/skill-readiness";
import type { Skill } from "@prisma/client";

interface DisciplineReadinessCellProps {
  skill: Skill;
  abbrev: string;
  icon: string;
  readiness?: number;
  done: boolean;
  partial: boolean;
  locked: boolean;
  dimmed: boolean;
}

export function DisciplineReadinessCell({
  abbrev,
  icon,
  readiness,
  done,
  partial,
  locked,
  dimmed,
}: DisciplineReadinessCellProps) {
  const hasReadiness = readiness != null && readiness >= 0;
  const fill = hasReadiness ? getReadinessFillStyle(readiness) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg min-w-0 border border-transparent",
        dimmed && "opacity-40",
        !hasReadiness &&
          (locked
            ? "bg-surface-container text-on-surface-variant"
            : "bg-surface-container-low text-on-surface-variant")
      )}
    >
      {fill && (
        <div
          className={cn("absolute inset-y-0 left-0", fill.fillClass)}
          style={{ width: `${fill.widthPercent}%` }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "relative z-[1] flex items-center gap-xs px-sm py-xs font-label-sm text-label-sm min-w-0",
          fill?.contentClass ??
            (done
              ? "text-success"
              : partial
                ? "text-tertiary"
                : "text-on-surface-variant")
        )}
      >
        <span className="material-symbols-outlined text-[16px] shrink-0">
          {done ? "check_circle" : partial ? "timelapse" : icon}
        </span>
        <span className="truncate">{abbrev}</span>
      </div>
    </div>
  );
}

export type { SkillReadinessMap };
