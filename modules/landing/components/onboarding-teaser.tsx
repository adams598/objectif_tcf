"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/providers/locale-provider";

export function OnboardingTeaser() {
  const { t } = useTranslation();

  const steps = [
    {
      number: 1,
      titleKey: "landingFeatures.step1Title" as const,
      descKey: "landingFeatures.step1Desc" as const,
      active: true,
    },
    {
      number: 2,
      titleKey: "landingFeatures.step2Title" as const,
      descKey: "landingFeatures.step2Desc" as const,
      active: false,
    },
    {
      number: 3,
      titleKey: "landingFeatures.step3Title" as const,
      descKey: "landingFeatures.step3Desc" as const,
      active: false,
    },
    {
      number: 4,
      titleKey: "landingFeatures.step4Title" as const,
      descKey: "landingFeatures.step4Desc" as const,
      active: false,
    },
    {
      number: 5,
      titleKey: "landingFeatures.step5Title" as const,
      descKey: "landingFeatures.step5Desc" as const,
      active: false,
    },
  ];

  return (
    <section id="methode" className="py-xl md:py-2xl px-md md:px-lg max-w-container-max mx-auto">
      <div className="mb-xl text-center md:text-left">
        <h2 className="font-display-md text-[28px] leading-tight md:text-display-md lg:text-display-lg text-on-surface font-bold mb-sm">
          {t("landingFeatures.onboardingTitle")}
        </h2>
        <p className="font-body-md md:font-body-lg text-body-md md:text-body-lg text-on-surface-variant max-w-2xl mx-auto md:mx-0">
          {t("landingFeatures.onboardingSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg items-center">
        <div className="md:col-span-5 flex flex-col gap-md relative">
          <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-surface-variant z-0 hidden sm:block" />

          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative z-10 flex gap-md items-start group ${
                !step.active ? "opacity-70 hover:opacity-100 transition-opacity" : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-headline-lg shrink-0 shadow-md ${
                  step.active
                    ? "bg-primary text-on-primary"
                    : "bg-surface border-2 border-surface-variant text-on-surface-variant"
                }`}
              >
                {step.number}
              </div>
              <div className="pt-2 min-w-0">
                <h3 className="font-headline-lg text-[18px] md:text-[20px] text-on-surface font-bold mb-xs">
                  {t(step.titleKey)}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {t(step.descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="md:col-span-7 bg-surface-container rounded-2xl p-md md:p-lg lg:p-xl min-h-[360px] md:h-[500px] relative overflow-hidden flex items-center justify-center border border-outline-variant">
          <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container-high opacity-50" />

          <div className="relative z-10 glass-panel w-full max-w-md rounded-2xl p-md md:p-lg shadow-violet-lg border border-white/50">
            <div className="flex justify-between items-center mb-md border-b border-outline-variant/30 pb-sm gap-sm">
              <div className="min-w-0 text-left">
                <h4 className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                  {t("landingFeatures.mockActiveSkill")}
                </h4>
                <span className="font-headline-lg text-[18px] md:text-[20px] text-on-surface font-bold">
                  {t("landingFeatures.mockCo")}
                </span>
              </div>
              <span className="px-sm py-xs bg-tertiary-container text-on-tertiary-container rounded text-xs font-bold shrink-0">
                {t("landingFeatures.mockTargetC1")}
              </span>
            </div>

            <div className="space-y-md">
              <div>
                <div className="flex justify-between font-label-sm text-label-sm mb-xs">
                  <span className="text-on-surface">{t("landingFeatures.mockProgress")}</span>
                  <span className="text-primary font-bold">78%</span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-primary rounded-full w-[78%] transition-all duration-700" />
                </div>
              </div>

              <div className="bg-surface rounded-xl p-md border border-outline-variant/30">
                <div className="flex items-center gap-sm mb-sm text-primary">
                  <span className="material-symbols-outlined">headphones</span>
                  <span className="font-label-sm text-label-sm">
                    {t("landingFeatures.mockListen")}
                  </span>
                </div>
                <div className="h-10 bg-surface-container-highest rounded-lg w-full mb-sm flex items-center px-sm">
                  <div className="w-full h-1 bg-outline-variant/50 rounded-full">
                    <div className="h-full bg-primary w-1/3 rounded-full relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow" />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full btn-primary py-sm rounded-lg font-label-md text-label-md flex justify-center items-center gap-xs"
              >
                {t("landingFeatures.mockContinue")}
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
