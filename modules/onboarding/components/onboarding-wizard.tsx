"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/locale-provider";

const TOTAL_STEPS = 5;

interface OnboardingData {
  immigrationObjective?: string;
  currentLevel?: string;
  targetExamDate?: string;
  nativeLanguage?: string;
  targetCountry?: string;
}

type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string;

function validateStep(
  step: number,
  data: OnboardingData,
  t: TranslateFn
): string | null {
  switch (step) {
    case 1:
      return data.immigrationObjective ? null : t("onboarding.errorObjective");
    case 2:
      return data.currentLevel ? null : t("onboarding.errorLevel");
    case 3:
      return data.targetExamDate ? null : t("onboarding.errorExamDate");
    case 4:
      return data.nativeLanguage ? null : t("onboarding.errorLanguage");
    case 5:
      return data.targetCountry ? null : t("onboarding.errorCountry");
    default:
      return null;
  }
}

function getFirstIncompleteStep(data: OnboardingData): number | null {
  if (!data.immigrationObjective) return 1;
  if (!data.currentLevel) return 2;
  if (!data.targetExamDate) return 3;
  if (!data.nativeLanguage) return 4;
  if (!data.targetCountry) return 5;
  return null;
}

function getStepTitle(step: number, t: TranslateFn): string {
  const titles: Record<number, string> = {
    1: t("onboarding.stepTitle1"),
    2: t("onboarding.stepTitle2"),
    3: t("onboarding.stepTitle3"),
    4: t("onboarding.stepTitle4"),
    5: t("onboarding.stepTitle5"),
  };
  return titles[step] ?? "";
}

export function OnboardingWizard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState(false);

  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const selectAndAdvance = (updates: Partial<OnboardingData>) => {
    const nextData = { ...data, ...updates };
    setData(nextData);
    if (step < TOTAL_STEPS) {
      setTimeout(() => setStep((s) => s + 1), 300);
    }
  };

  const next = () => {
    const error = validateStep(step, data, t);
    if (error) {
      toast.error(error);
      return;
    }
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
  };

  const skipExamDate = () => {
    const defaultDate = new Date();
    defaultDate.setMonth(defaultDate.getMonth() + 6);
    updateData({ targetExamDate: defaultDate.toISOString().split("T")[0] });
    setStep((s) => s + 1);
    toast.message(t("onboarding.skipDateToast"));
  };

  const prev = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const submit = async () => {
    const incompleteStep = getFirstIncompleteStep(data);
    if (incompleteStep !== null) {
      const message = validateStep(incompleteStep, data, t);
      toast.error(message ?? t("onboarding.errorIncomplete"));
      setStep(incompleteStep);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/utilisateurs/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success(t("onboarding.successToast"));
        router.push("/tableau-de-bord");
        router.refresh();
      } else {
        const result = await response.json().catch(() => null);
        toast.error(result?.error ?? t("onboarding.errorConfig"));
      }
    } catch {
      toast.error(t("onboarding.genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-md">
      <div className="w-full max-w-2xl mx-auto flex flex-col min-h-[600px]">
        <div className="w-full pt-8 pb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              {t("onboarding.stepOf", { step, total: TOTAL_STEPS })}
            </span>
            <span className="font-label-sm text-label-sm text-primary font-bold">
              {getStepTitle(step, t)}
            </span>
          </div>
          <Progress value={progress} size="default" />
        </div>

        <AnimatePresence mode="wait">
          <motion.main
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="flex-grow flex flex-col items-center justify-center w-full"
          >
            {step === 1 && (
              <StepObjective
                selected={data.immigrationObjective}
                onSelect={(v) => selectAndAdvance({ immigrationObjective: v })}
              />
            )}
            {step === 2 && (
              <StepLevel
                selected={data.currentLevel}
                onSelect={(v) => selectAndAdvance({ currentLevel: v })}
              />
            )}
            {step === 3 && (
              <StepExamDate
                value={data.targetExamDate}
                onChange={(v) => updateData({ targetExamDate: v })}
                onSkip={skipExamDate}
              />
            )}
            {step === 4 && (
              <StepLanguage
                selected={data.nativeLanguage}
                onSelect={(v) => selectAndAdvance({ nativeLanguage: v })}
              />
            )}
            {step === 5 && (
              <StepCountry
                selected={data.targetCountry}
                onSelect={(v) => updateData({ targetCountry: v })}
              />
            )}
          </motion.main>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-8 pb-8">
          <Button
            variant="secondary"
            size="default"
            onClick={prev}
            disabled={step === 1}
            className={step === 1 ? "invisible" : ""}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            {t("onboarding.prev")}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button size="default" onClick={next}>
              {t("onboarding.next")}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          ) : (
            <Button size="default" onClick={submit} loading={isLoading}>
              {t("onboarding.startJourney")}
              <span className="material-symbols-outlined">rocket_launch</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepObjective({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();

  const objectives = [
    {
      id: "RESIDENCE_PERMANENTE",
      icon: "home_work",
      titleKey: "onboarding.objectiveResidence" as const,
      descKey: "onboarding.objectiveResidenceDesc" as const,
    },
    {
      id: "ETUDES",
      icon: "school",
      titleKey: "onboarding.objectiveStudies" as const,
      descKey: "onboarding.objectiveStudiesDesc" as const,
    },
    {
      id: "TRAVAIL",
      icon: "work",
      titleKey: "onboarding.objectiveWork" as const,
      descKey: "onboarding.objectiveWorkDesc" as const,
    },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">
          {t("onboarding.objectiveTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("onboarding.objectiveSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md w-full">
        {objectives.map((obj) => (
          <button
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            className={cn(
              "flex flex-col items-center text-center p-xl bg-surface border rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-primary",
              selected === obj.id
                ? "border-primary shadow-violet-md bg-surface-container-low"
                : "border-surface-variant hover:border-primary"
            )}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-200",
                selected === obj.id
                  ? "bg-primary-container text-primary"
                  : "bg-surface-container text-on-surface-variant group-hover:bg-primary-container group-hover:text-primary"
              )}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "32px",
                  fontVariationSettings:
                    selected === obj.id ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {obj.icon}
              </span>
            </div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">
              {t(obj.titleKey)}
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t(obj.descKey)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepLevel({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];

  const getLevelLabel = (level: string) => {
    if (level === "A1" || level === "A2") return t("onboarding.levelBeginner");
    if (level === "B1" || level === "B2") return t("onboarding.levelIntermediate");
    return t("onboarding.levelAdvanced");
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">
          {t("onboarding.levelTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("onboarding.levelSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-md w-full">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={cn(
              "flex flex-col items-center justify-center p-lg rounded-xl border transition-all duration-200 font-display-md text-display-md font-bold",
              selected === level
                ? "border-primary bg-primary/10 text-primary shadow-violet-sm"
                : "border-surface-variant bg-surface text-on-surface hover:border-primary hover:bg-surface-container"
            )}
          >
            {level}
            <span className="text-xs font-label-sm font-normal mt-1 text-on-surface-variant">
              {getLevelLabel(level)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepExamDate({
  value,
  onChange,
  onSkip,
}: {
  value?: string;
  onChange: (v: string) => void;
  onSkip: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-10">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">
          {t("onboarding.examDateTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("onboarding.examDateSubtitle")}
        </p>
      </div>
      <div className="bg-surface border border-outline-variant rounded-2xl p-xl shadow-violet-sm">
        <label className="block font-label-md text-label-md text-on-surface-variant mb-sm">
          {t("onboarding.examDateLabel")}
        </label>
        <input
          type="date"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full h-12 px-md rounded-xl border border-outline-variant bg-surface text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
        />
        <p className="mt-sm font-label-sm text-label-sm text-on-surface-variant">
          {t("onboarding.examDateHint")}
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-md w-full text-center font-label-md text-label-md text-primary hover:underline"
        >
          {t("onboarding.skipExamDate")}
        </button>
      </div>
    </div>
  );
}

function StepLanguage({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();

  const languages = [
    { code: "ar", flag: "🇸🇦", labelKey: "onboarding.langArabic" as const },
    { code: "fr", flag: "🇫🇷", labelKey: "onboarding.langFrench" as const },
    { code: "en", flag: "🇬🇧", labelKey: "onboarding.langEnglish" as const },
    { code: "es", flag: "🇪🇸", labelKey: "onboarding.langSpanish" as const },
    { code: "pt", flag: "🇧🇷", labelKey: "onboarding.langPortuguese" as const },
    { code: "zh", flag: "🇨🇳", labelKey: "onboarding.langMandarin" as const },
    { code: "ha", flag: "🇳🇬", labelKey: "onboarding.langHausa" as const },
    { code: "sw", flag: "🇰🇪", labelKey: "onboarding.langSwahili" as const },
    { code: "other", flag: "🌍", labelKey: "onboarding.langOther" as const },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">
          {t("onboarding.languageTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("onboarding.languageSubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-md w-full">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className={cn(
              "flex flex-col items-center justify-center p-md rounded-xl border transition-all duration-200",
              selected === lang.code
                ? "border-primary bg-primary/10 shadow-violet-sm"
                : "border-surface-variant bg-surface hover:border-primary hover:bg-surface-container"
            )}
          >
            <span className="text-3xl mb-sm">{lang.flag}</span>
            <span className="font-label-md text-label-md text-on-surface">
              {t(lang.labelKey)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepCountry({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const { t } = useTranslation();

  const countries = [
    { code: "CA", flag: "🇨🇦", labelKey: "onboarding.countryCanada" as const },
    { code: "QC", flag: "🏔️", labelKey: "onboarding.countryQuebec" as const },
    { code: "ON", flag: "🏙️", labelKey: "onboarding.countryOntario" as const },
    { code: "BC", flag: "🌊", labelKey: "onboarding.countryBc" as const },
  ];

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">
          {t("onboarding.countryTitle")}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          {t("onboarding.countrySubtitle")}
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-md w-full">
        {countries.map((country) => (
          <button
            key={country.code}
            onClick={() => onSelect(country.code)}
            className={cn(
              "flex flex-col items-center justify-center p-lg rounded-xl border transition-all duration-200",
              selected === country.code
                ? "border-primary bg-primary/10 shadow-violet-sm"
                : "border-surface-variant bg-surface hover:border-primary hover:bg-surface-container"
            )}
          >
            <span className="text-4xl mb-sm">{country.flag}</span>
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {t(country.labelKey)}
            </span>
          </button>
        ))}
      </div>
      <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-lg">
        {t("onboarding.countryHint")}
      </p>
    </div>
  );
}
