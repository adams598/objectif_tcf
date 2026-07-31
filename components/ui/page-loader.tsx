"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { cn } from "@/lib/utils";

type PageLoaderProps = {
  variant?: "fullscreen" | "content";
  className?: string;
};

function ProgressRail({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] overflow-hidden bg-outline-variant/20"
      aria-hidden
    >
      <motion.div
        className="h-full w-[40%] bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ x: ["-100%", "350%"] }}
        transition={{
          duration: 1.1,
          repeat: Infinity,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </div>
  );
}

function GradientRing({ reduced }: { reduced: boolean }) {
  const gradId = useId();

  return (
    <div className="relative h-10 w-10" aria-hidden>
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          className="stroke-outline-variant/35"
          strokeWidth="2"
        />
      </svg>
      <div
        className={cn(
          "absolute inset-0",
          !reduced && "animate-[spin_0.9s_linear_infinite]"
        )}
      >
        <svg viewBox="0 0 40 40" className="h-full w-full">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
              <stop offset="45%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--primary-container)" stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="28 72"
          />
        </svg>
      </div>
    </div>
  );
}

function PulseDots({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-primary/70"
          animate={
            reduced
              ? { opacity: 0.5, scale: 1 }
              : { opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }
          }
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.18,
                }
          }
        />
      ))}
    </div>
  );
}

export function PageLoader({ variant = "fullscreen", className }: PageLoaderProps) {
  const reduced = useReducedMotion() ?? false;
  const isFullscreen = variant === "fullscreen";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Chargement"
      className={cn(
        "relative flex items-center justify-center",
        isFullscreen
          ? "fixed inset-0 z-[100] bg-surface/80 backdrop-blur-[3px]"
          : "w-full min-h-[48vh] py-2xl",
        className
      )}
    >
      <ProgressRail active={isFullscreen && !reduced} />

      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-md"
      >
        <GradientRing reduced={reduced} />

        <div className="flex flex-col items-center gap-sm">
          <PulseDots reduced={reduced} />
          <p className="font-label-sm text-[11px] font-medium uppercase tracking-[0.22em] text-on-surface-variant/55">
            Chargement
          </p>
        </div>
      </motion.div>
    </div>
  );
}
