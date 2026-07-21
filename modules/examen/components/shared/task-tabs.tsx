"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TaskTabsProps {
  tasks: Array<{ id: number; label: string; badge?: number }>;
  activeId: number;
  onChange: (id: number) => void;
}

export function TaskTabs({ tasks, activeId, onChange }: TaskTabsProps) {
  return (
    <div className="flex gap-sm flex-wrap">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          onClick={() => onChange(task.id)}
          className={cn(
            "relative px-lg py-sm rounded-xl font-label-md text-label-md font-bold transition-all",
            activeId === task.id
              ? "bg-primary text-on-primary shadow-violet-sm"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          {task.label}
          {task.badge !== undefined && (
            <span
              className={cn(
                "ml-sm inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold",
                activeId === task.id
                  ? "bg-on-primary/20 text-on-primary"
                  : "bg-tertiary-container text-tertiary"
              )}
            >
              {task.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
