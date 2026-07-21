"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/providers/locale-provider";

export function FeaturesBento() {
  const { t } = useTranslation();

  const features = [
    {
      id: "banque",
      icon: "library_books",
      titleKey: "landingFeatures.banqueTitle" as const,
      descKey: "landingFeatures.banqueDesc" as const,
      bgColor: "bg-primary-container",
      textColor: "text-on-primary-container",
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
      rowSpan: "row-span-2",
      size: "large" as const,
    },
    {
      id: "oral",
      icon: "record_voice_over",
      titleKey: "landingFeatures.oralTitle" as const,
      descKey: "landingFeatures.oralDesc" as const,
      bgColor: "bg-secondary-container",
      textColor: "text-on-secondary-container",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
    {
      id: "ia",
      icon: "edit_document",
      titleKey: "landingFeatures.iaTitle" as const,
      descKey: "landingFeatures.iaDesc" as const,
      bgColor: "bg-tertiary-container",
      textColor: "text-on-tertiary-container",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
    {
      id: "timer",
      icon: "timer",
      titleKey: "landingFeatures.timerTitle" as const,
      descKey: "landingFeatures.timerDesc" as const,
      bgColor: "bg-error-container",
      textColor: "text-on-error-container",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
    {
      id: "analytics",
      icon: "monitoring",
      titleKey: "landingFeatures.analyticsTitle" as const,
      descKey: "landingFeatures.analyticsDesc" as const,
      bgColor: "bg-primary/10",
      textColor: "text-primary",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
    {
      id: "community",
      icon: "forum",
      titleKey: "landingFeatures.communityTitle" as const,
      descKey: "landingFeatures.communityDesc" as const,
      bgColor: "bg-surface-variant",
      textColor: "text-on-surface",
      colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
      rowSpan: "",
      size: "wide" as const,
    },
    {
      id: "mobile",
      icon: "phone_iphone",
      titleKey: "landingFeatures.mobileTitle" as const,
      descKey: "landingFeatures.mobileDesc" as const,
      bgColor: "bg-secondary/10",
      textColor: "text-secondary",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
    {
      id: "garantie",
      icon: "verified_user",
      titleKey: "landingFeatures.garantieTitle" as const,
      descKey: "landingFeatures.garantieDesc" as const,
      bgColor: "bg-tertiary/10",
      textColor: "text-tertiary",
      colSpan: "",
      rowSpan: "",
      size: "small" as const,
    },
  ];

  const mobileSkills = [
    {
      icon: "headphones",
      titleKey: "landingFeatures.mobileCoTitle" as const,
      descKey: "landingFeatures.mobileCoDesc" as const,
    },
    {
      icon: "mic",
      titleKey: "landingFeatures.mobileEoTitle" as const,
      descKey: "landingFeatures.mobileEoDesc" as const,
    },
    {
      icon: "menu_book",
      titleKey: "landingFeatures.mobileCeTitle" as const,
      descKey: "landingFeatures.mobileCeDesc" as const,
    },
    {
      icon: "edit_document",
      titleKey: "landingFeatures.mobileEeTitle" as const,
      descKey: "landingFeatures.mobileEeDesc" as const,
    },
  ];

  return (
    <>
      <section className="hidden md:block py-2xl bg-surface">
        <div className="max-w-container-max mx-auto px-md md:px-lg">
          <div className="text-center mb-xl">
            <h2 className="font-display-md text-display-md md:text-display-lg text-on-surface font-bold mb-sm">
              {t("landingFeatures.bentoTitle")}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              {t("landingFeatures.bentoSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-md">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                className={`bg-surface-container-low border border-surface-variant rounded-2xl p-lg hover:border-primary/30 transition-colors group ${feature.colSpan} ${feature.rowSpan} ${
                  feature.size === "large" ? "flex flex-col" : ""
                }`}
              >
                <div
                  className={`${
                    feature.size === "large"
                      ? "w-12 h-12 rounded-xl mb-md"
                      : "w-10 h-10 rounded-lg mb-sm"
                  } ${feature.bgColor} ${feature.textColor} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}
                >
                  <span
                    className={`material-symbols-outlined ${
                      feature.size === "large" ? "text-[24px]" : "text-[20px]"
                    }`}
                  >
                    {feature.icon}
                  </span>
                </div>

                <h3
                  className={`font-bold text-on-surface mb-xs ${
                    feature.size === "large"
                      ? "font-headline-lg text-[24px]"
                      : "font-label-md text-label-md text-lg"
                  }`}
                >
                  {t(feature.titleKey)}
                </h3>

                <p
                  className={`text-on-surface-variant ${
                    feature.size === "large"
                      ? "font-body-md text-body-md mb-lg flex-grow"
                      : "font-body-md text-body-md text-sm"
                  }`}
                >
                  {t(feature.descKey)}
                </p>

                {feature.size === "large" && (
                  <div className="h-32 bg-surface rounded-xl border border-outline-variant/30 flex items-center justify-center opacity-70">
                    <span className="text-on-surface-variant font-label-sm">
                      {t("landingFeatures.banqueIllustration")}
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="md:hidden py-xl px-md bg-surface-container-lowest">
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface mb-lg text-center">
          {t("landingFeatures.mobileSkillsTitle")}
        </h2>
        <div className="grid grid-cols-1 gap-md">
          {mobileSkills.map((skill) => (
            <div
              key={skill.icon}
              className="bg-surface p-md rounded-2xl border border-outline-variant shadow-violet-sm flex flex-col gap-md"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">
                  {skill.icon}
                </span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md font-bold text-on-surface mb-xs">
                  {t(skill.titleKey)}
                </h3>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  {t(skill.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
