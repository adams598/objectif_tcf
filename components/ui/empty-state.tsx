import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  className?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-xl px-lg rounded-2xl border border-dashed border-outline-variant bg-surface-container-low",
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center mb-md">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant">
          {icon}
        </span>
      </div>
      <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-xs">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
        {description}
      </p>
      {action && <div className="mt-md">{action}</div>}
    </div>
  );
}
