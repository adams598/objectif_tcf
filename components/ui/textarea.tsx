import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-label-md text-label-md text-on-surface-variant mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface",
            "placeholder:text-on-surface-variant/50",
            "transition-all duration-200 resize-y",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-container",
            error && "border-error focus-visible:border-error focus-visible:ring-error/20",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 font-label-sm text-label-sm text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 font-label-sm text-label-sm text-on-surface-variant">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
