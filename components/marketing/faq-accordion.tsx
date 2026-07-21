"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface FaqAccordionProps {
  items: { question: string; answer: string }[];
  searchQuery?: string;
}

export function FaqAccordion({ items, searchQuery = "" }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const query = searchQuery.toLowerCase().trim();

  const filtered = query
    ? items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
      )
    : items;

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-sm">
      {filtered.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.question}
            className="rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-violet-sm"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className={cn(
                "w-full flex items-center justify-between gap-md px-lg py-md text-left transition-colors border-l-4",
                isOpen
                  ? "border-l-primary bg-primary/5"
                  : "border-l-primary/40 hover:bg-surface-container"
              )}
            >
              <span className="font-label-md text-label-md font-medium text-on-surface">
                {item.question}
              </span>
              <span className="material-symbols-outlined text-primary shrink-0">
                {isOpen ? "remove" : "add"}
              </span>
            </button>
            {isOpen && (
              <div className="px-lg pb-md font-body-md text-body-md text-on-surface-variant leading-relaxed border-t border-outline-variant pt-md">
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
