import React from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  title?: string;
  headers: string[];
  rows: string[][];
  className?: string;
}

export function DataTable({ title, headers, rows, className }: DataTableProps) {
  return (
    <div className={cn("space-y-sm", className)}>
      {title && (
        <p className="font-label-md text-label-md font-bold text-on-surface">
          {title}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-surface-container">
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-md py-sm font-label-sm text-label-sm font-semibold text-on-surface text-center border-b border-outline-variant"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-outline-variant last:border-b-0 even:bg-surface-container-low/50"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={cn(
                      "px-md py-sm font-body-sm text-body-sm text-on-surface-variant text-center",
                      cellIndex === 0 && "font-semibold text-on-surface"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MarketingPageHeroProps {
  title: string;
  highlight?: string;
  subtitle?: string;
}

export function MarketingPageHero({
  title,
  highlight,
  subtitle,
}: MarketingPageHeroProps) {
  return (
    <div className="mb-2xl">
      <h1 className="font-display-md text-display-md text-on-surface font-bold mb-sm">
        {title}{" "}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h1>
      {subtitle && (
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface MarketingPageShellProps {
  children: React.ReactNode;
  narrow?: boolean;
}

export function MarketingPageShell({
  children,
  narrow = false,
}: MarketingPageShellProps) {
  return (
    <div
      className={cn(
        "py-2xl px-md md:px-lg mx-auto",
        narrow ? "max-w-3xl" : "max-w-container-max"
      )}
    >
      {children}
    </div>
  );
}
