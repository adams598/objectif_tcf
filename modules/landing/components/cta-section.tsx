"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

export function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-xl md:py-2xl px-md md:px-lg max-w-container-max mx-auto mb-xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-primary-container rounded-3xl p-lg md:p-xl lg:p-2xl text-center relative overflow-hidden flex flex-col items-center"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary rounded-full mix-blend-multiply opacity-20 filter blur-2xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary rounded-full mix-blend-multiply opacity-20 filter blur-2xl" />

        <h2 className="font-display-lg text-[28px] leading-tight md:text-display-md lg:text-[48px] text-on-primary-container font-bold mb-md relative z-10 px-xs">
          {t("landingFeatures.ctaTitle")}
        </h2>
        <p className="font-body-md md:font-body-lg text-body-md md:text-body-lg text-on-primary-container/80 max-w-2xl mb-lg relative z-10">
          {t("landingFeatures.ctaSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm md:gap-md relative z-10 w-full max-w-md sm:max-w-none sm:w-auto">
          <Button asChild size="xl" className="w-full sm:w-auto relative z-10 shadow-lg hover:shadow-xl transition-shadow">
            <Link href="/offres">
              {t("landingFeatures.choosePlan")}
              <span className="material-symbols-outlined">payments</span>
            </Link>
          </Button>
          <Button asChild variant="secondary" size="xl" className="w-full sm:w-auto relative z-10">
            <Link href="/inscription">
              {t("landingFeatures.freeTrial")}
              <span className="material-symbols-outlined">rocket_launch</span>
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
