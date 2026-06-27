"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressTrackVariants = cva(
  "relative overflow-hidden rounded-full bg-surface-variant",
  {
    variants: {
      size: {
        sm: "h-1.5",
        default: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

const progressFillVariants = cva(
  "h-full w-full flex-1 rounded-full transition-all duration-700 ease-out",
  {
    variants: {
      color: {
        primary: "bg-gradient-primary",
        success: "bg-success",
        warning: "bg-tertiary",
        error: "bg-error",
      },
    },
    defaultVariants: {
      color: "primary",
    },
  }
);

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressTrackVariants> {
  fillColor?: "primary" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, size, fillColor = "primary", showLabel, label, ...props }, ref) => (
  <div className="w-full">
    {(showLabel || label) && (
      <div className="flex justify-between items-center mb-1">
        {label && (
          <span className="font-label-sm text-label-sm text-on-surface">
            {label}
          </span>
        )}
        {showLabel && value !== undefined && (
          <span className="font-label-sm text-label-sm text-primary font-bold">
            {Math.round(value ?? 0)}%
          </span>
        )}
      </div>
    )}
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(progressTrackVariants({ size, className }))}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(progressFillVariants({ color: fillColor }))}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
