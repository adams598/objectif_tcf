"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface QcmOptionsProps {
  choices: { id: string; content: string }[];
  selectedId?: string;
  onSelect: (id: string) => void;
  name: string;
}

export function QcmOptions({
  choices,
  selectedId,
  onSelect,
  name,
}: QcmOptionsProps) {
  return (
    <div className="flex flex-col gap-xs">
      {choices.map((choice, i) => {
        const letter = String.fromCharCode(65 + i);
        const isSelected = selectedId === choice.id;

        return (
          <label key={choice.id} className="cursor-pointer group">
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={isSelected}
              onChange={() => onSelect(choice.id)}
            />
            <div
              className={cn(
                "flex items-center gap-sm px-sm py-xs rounded-lg border transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant bg-surface hover:border-primary/30 hover:bg-surface-container-low"
              )}
            >
              <span
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold shrink-0 transition-colors",
                  isSelected
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant"
                )}
              >
                {letter}
              </span>
              <span
                className={cn(
                  "font-body-md text-body-md",
                  isSelected ? "text-primary font-medium" : "text-on-surface"
                )}
              >
                {choice.content}
              </span>
            </div>
          </label>
        );
      })}
    </div>
  );
}
