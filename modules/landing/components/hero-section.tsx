"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

export function HeroSection() {
  const { t } = useTranslation();

  const stats = [
    { value: "12 000+", labelKey: "landing.statCandidates" as const },
    { value: "94%", labelKey: "landing.statSuccessRate" as const },
    { value: "47", labelKey: "landing.statCountries" as const },
  ];

  const examCtas = [
    { href: "/preparation/tcf", labelKey: "landing.startTcf" as const, icon: "school" },
    { href: "/preparation/tef", labelKey: "landing.startTef" as const, icon: "translate" },
    { href: "/preparation/ielts", labelKey: "landing.startIelts" as const, icon: "language" },
  ];

  return (
    <section className="relative flex flex-col items-center justify-center pt-xl pb-xl px-md md:min-h-[921px] md:pt-2xl md:pb-2xl md:px-lg overflow-hidden">
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
        <div className="absolute top-0 -left-4 w-48 h-48 md:w-72 md:h-72 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-48 h-48 md:w-72 md:h-72 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-48 h-48 md:w-72 md:h-72 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="max-w-container-max mx-auto text-center flex flex-col items-center gap-lg md:gap-xl relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-sm px-md py-xs rounded-full border border-primary/20 bg-primary/5 text-primary font-label-sm text-label-sm"
        >
          <span className="material-symbols-outlined text-[16px]">verified</span>
          <span>{t("landing.officialPrep")}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display-lg text-[36px] leading-[1.15] sm:text-display-lg md:text-[72px] md:leading-[1.1] font-bold text-on-surface max-w-4xl tracking-tight px-xs"
        >
          {t("landing.heroHeadlineFull")}{" "}
          <br />
          <span className="gradient-text">{t("landing.heroHeadlineC2")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-body-md text-body-md md:font-body-lg md:text-body-lg text-on-surface-variant max-w-2xl mx-auto md:text-[20px] px-xs"
        >
          {t("landing.heroDescDesktop")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-sm md:gap-md mt-sm w-full max-w-lg md:max-w-none md:flex-wrap md:justify-center"
        >
          {examCtas.map((cta) => (
            <Button asChild key={cta.href} size="xl" className="w-full md:w-auto">
              <Link href={cta.href}>
                {t(cta.labelKey)}
                <span className="material-symbols-outlined text-[20px]">
                  {cta.icon}
                </span>
              </Link>
            </Button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm md:gap-md w-full max-w-lg md:max-w-none md:justify-center"
        >
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
            <Link href="/offres">
              {t("landing.viewOffers")}
              <span className="material-symbols-outlined text-[20px]">
                payments
              </span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
            <Link href="/inscription">
              {t("landing.createAccount")}
              <span className="material-symbols-outlined text-[20px]">
                arrow_forward
              </span>
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-lg md:mt-2xl glass-panel rounded-2xl p-md md:p-lg w-full max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-md md:flex md:flex-row md:justify-around md:items-center md:gap-lg"
        >
          {stats.map((stat, index) => (
            <React.Fragment key={stat.value}>
              <div className="flex flex-col items-center text-center px-sm">
                <span className="font-headline-lg text-[22px] md:text-headline-lg text-primary font-bold">
                  {stat.value}
                </span>
                <span className="font-label-sm md:font-label-md text-label-sm md:text-label-md text-on-surface-variant">
                  {t(stat.labelKey)}
                </span>
              </div>
              {index < stats.length - 1 && (
                <div className="hidden sm:block w-px h-12 bg-outline-variant self-center" />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
