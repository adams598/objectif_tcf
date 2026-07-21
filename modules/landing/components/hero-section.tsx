"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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

  const mobileStats = [
    { value: "500+", labelKey: "landing.statExercises" as const },
    { value: "4", labelKey: "landing.statSkills" as const },
    { value: "C2", labelKey: "landing.statGoal" as const },
  ];

  return (
    <>
      <section className="hidden md:flex relative min-h-[921px] flex-col items-center justify-center pt-2xl pb-2xl px-md md:px-lg overflow-hidden">
        <div className="absolute inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-40">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-tertiary-container rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        <div className="max-w-container-max mx-auto text-center flex flex-col items-center gap-xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-sm px-md py-xs rounded-full border border-primary/20 bg-primary/5 text-primary font-label-sm text-label-sm mb-sm"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>{t("landing.officialPrep")}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display-lg text-display-lg md:text-[72px] md:leading-[1.1] font-bold text-on-surface max-w-4xl tracking-tight"
          >
            {t("landing.heroHeadlineFull")}{" "}
            <br />
            <span className="gradient-text">{t("landing.heroHeadlineC2")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto md:text-[20px]"
          >
            {t("landing.heroDescDesktop")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-md mt-md flex-wrap justify-center"
          >
            {examCtas.map((cta) => (
              <Button asChild key={cta.href} size="xl" className="w-full sm:w-auto">
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
            className="flex flex-col sm:flex-row items-center gap-md mt-sm"
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
            className="mt-2xl glass-panel rounded-2xl p-lg w-full max-w-5xl flex flex-col md:flex-row justify-around items-center gap-lg"
          >
            {stats.map((stat, index) => (
              <React.Fragment key={stat.value}>
                <div className="flex flex-col items-center text-center">
                  <span className="font-headline-lg text-headline-lg text-primary font-bold">
                    {stat.value}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {t(stat.labelKey)}
                  </span>
                </div>
                {index < stats.length - 1 && (
                  <div className="hidden md:block w-px h-12 bg-outline-variant" />
                )}
              </React.Fragment>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="md:hidden bg-gradient-to-br from-surface to-secondary-container/30 px-md py-xl flex flex-col items-center text-center relative overflow-hidden min-h-screen">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #4f378a 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-lg">
          <div className="inline-flex items-center gap-xs px-md py-xs rounded-full bg-surface-container-lowest border border-outline-variant text-label-sm font-label-sm text-primary mb-sm shadow-violet-sm">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>{t("landing.mobileCertified")}</span>
          </div>

          <h1 className="font-display-lg text-display-md text-primary font-bold leading-tight">
            {t("landing.heroHeadlineC2")}
          </h1>

          <p className="font-body-md text-body-md text-on-surface-variant">
            {t("landing.mobileDesc")}
          </p>

          <div className="w-full flex flex-col gap-sm mt-md">
            <Button asChild size="lg" className="w-full">
              <Link href="/preparation/tcf">{t("landing.tryFreeTcf")}</Link>
            </Button>
            <div className="grid grid-cols-2 gap-sm">
              <Button asChild variant="secondary" size="default" className="w-full">
                <Link href="/preparation/tef">{t("landing.startTef")}</Link>
              </Button>
              <Button asChild variant="secondary" size="default" className="w-full">
                <Link href="/preparation/ielts">{t("landing.startIelts")}</Link>
              </Button>
            </div>
            <Button asChild variant="ghost" size="default" className="w-full">
              <Link href="/offres">{t("landing.viewOffers")}</Link>
            </Button>
          </div>

          <div className="w-full h-48 mt-lg rounded-2xl overflow-hidden shadow-violet-md border border-outline-variant relative">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
              alt={t("landing.studentAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute bottom-md left-md bg-surface-container-lowest/90 backdrop-blur-sm p-sm rounded-lg border border-outline-variant flex items-center gap-sm">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[18px]">
                  trending_up
                </span>
              </div>
              <div>
                <div className="font-label-sm text-label-sm text-on-surface">
                  {t("landing.targetScore")}
                </div>
                <div className="font-label-sm text-[10px] text-on-surface-variant">
                  {t("landing.successRate92")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm mt-xl bg-surface-container-lowest py-lg px-md border border-outline-variant rounded-2xl flex justify-around items-center shadow-violet-sm">
          {mobileStats.map((stat, i, arr) => (
            <React.Fragment key={stat.value}>
              <div className="flex flex-col items-center text-center">
                <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
                  {stat.value}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                  {t(stat.labelKey)}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-px h-12 bg-outline-variant" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
