"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

interface ExamShellProps {
  skillLabel: string;
  seriesLabel: string;
  examLabel: string;
  timeLeft: number;
  totalDuration: number;
  onFinish: () => void;
  onExit: () => void;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
}

export function formatExamTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamShell({
  skillLabel,
  seriesLabel,
  examLabel,
  timeLeft,
  totalDuration,
  onFinish,
  onExit,
  children,
  sidebar,
  footer,
}: ExamShellProps) {
  const { t } = useTranslation();
  const timeProgress = totalDuration > 0 ? (timeLeft / totalDuration) * 100 : 0;
  const isTimeLow = timeLeft < 5 * 60;

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col">
      <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-md border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-md px-md md:px-lg h-14">
          {/* Timer + bar */}
          <div className="flex items-center gap-sm min-w-[120px]">
            <span
              className={cn(
                "font-label-md text-label-md font-bold tabular-nums",
                isTimeLow ? "text-error" : "text-on-surface"
              )}
            >
              {formatExamTime(timeLeft)}
            </span>
            <div className="hidden sm:block w-24">
              <Progress
                value={timeProgress}
                size="sm"
                fillColor={isTimeLow ? "error" : "success"}
              />
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex-1 text-center min-w-0">
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {examLabel} · {seriesLabel} · {skillLabel}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-sm shrink-0">
            <button
              type="button"
              onClick={onExit}
              className="hidden md:flex items-center gap-xs text-on-surface-variant hover:text-primary font-label-sm text-label-sm transition-colors px-sm py-xs rounded-lg hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              {t("exam.quit")}
            </button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onFinish}
              className="rounded-xl"
            >
              {t("exam.end")}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-sm md:p-md">{children}</main>
        {sidebar && (
          <aside className="hidden lg:block w-[168px] xl:w-[176px] border-l border-outline-variant bg-surface p-sm overflow-y-hidden shrink-0">
            {sidebar}
          </aside>
        )}
      </div>

      {footer && (
        <footer className="sticky bottom-0 border-t border-outline-variant bg-surface/95 backdrop-blur-md px-md md:px-lg py-sm">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function useExamTimer(totalSeconds: number, onTimeUp?: () => void) {
  const [timeLeft, setTimeLeft] = React.useState(totalSeconds);
  const onTimeUpRef = React.useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  React.useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current?.();
      return;
    }
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [timeLeft]);

  return { timeLeft, setTimeLeft };
}
