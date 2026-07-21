"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface NavDropdownItem {
  href: string;
  label: string;
  description?: string;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
  isActive?: boolean;
}

export function NavDropdown({ label, items, isActive }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-xs font-label-md text-label-md transition-colors px-sm py-xs rounded-lg",
          isActive || open
            ? "text-primary font-bold bg-primary/10"
            : "text-on-surface-variant hover:text-primary"
        )}
      >
        {label}
        <span
          className={cn(
            "material-symbols-outlined text-[18px] transition-transform",
            open && "rotate-180"
          )}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-sm min-w-[280px] bg-surface rounded-2xl border border-outline-variant shadow-violet-lg p-sm z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-md py-sm rounded-xl hover:bg-surface-container transition-colors"
            >
              <span className="font-label-md text-label-md font-semibold text-on-surface block">
                {item.label}
              </span>
              {item.description && (
                <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
                  {item.description}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
