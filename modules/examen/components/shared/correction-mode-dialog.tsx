"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/locale-provider";

export type CorrectionMode = "instant" | "human";

interface CorrectionModeDialogProps {
  open: boolean;
  skillLabel: string;
  guestMode?: boolean;
  onConfirm: (mode: CorrectionMode) => void;
}

export function CorrectionModeDialog({
  open,
  skillLabel,
  guestMode,
  onConfirm,
}: CorrectionModeDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState<CorrectionMode>("instant");

  const options = [
    {
      id: "instant" as const,
      label: t("exam.instant"),
      desc: t("exam.instantDescShort"),
      available: true,
    },
    {
      id: "human" as const,
      label: t("exam.human"),
      desc: t("exam.humanDescShort"),
      available: !guestMode,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("exam.correctionModeTitle", { skill: skillLabel })}</DialogTitle>
          <DialogDescription>
            {t("exam.chooseCorrectionDesc")}
            {guestMode
              ? t("exam.guestModeInstantRecommend")
              : t("exam.changeDuringTest")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-sm">
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              disabled={!opt.available}
              onClick={() => setMode(opt.id)}
              className={cn(
                "text-left p-md rounded-xl border transition-all",
                !opt.available && "opacity-50 cursor-not-allowed",
                mode === opt.id
                  ? "border-primary bg-primary/5"
                  : "border-outline-variant hover:border-primary/30"
              )}
            >
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {opt.label}
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                {opt.desc}
                {!opt.available && t("exam.accountRequiredSuffix")}
              </p>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button className="w-full sm:w-auto" onClick={() => onConfirm(mode)}>
            {t("exam.startTest")}
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
