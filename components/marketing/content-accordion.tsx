"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ContentAccordionProps {
  items: { title: string; content: string }[];
  defaultOpen?: number;
}

export function ContentAccordion({ items, defaultOpen }: ContentAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    defaultOpen ?? null
  );

  return (
    <div className="space-y-sm">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.title}
            className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between gap-md px-lg py-md text-left hover:bg-surface-container transition-colors"
            >
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {item.title}
              </span>
              <span
                className={cn(
                  "material-symbols-outlined text-on-surface-variant transition-transform",
                  isOpen && "rotate-180"
                )}
              >
                expand_more
              </span>
            </button>
            {isOpen && (
              <div className="px-lg pb-md font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line border-t border-outline-variant pt-md">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
