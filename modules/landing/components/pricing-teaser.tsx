"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";

export function PricingTeaser() {
  const { t } = useTranslation();

  const highlights = [
    { exam: "TCF Canada", from: "10 000 XAF", days: "15 jours" },
    { exam: "TEF Canada", from: "10 000 XAF", days: "15 jours" },
    { exam: "IELTS", from: "7 500 XAF", days: "15 jours" },
  ];

  return (
    <section className="py-2xl px-md md:px-lg max-w-container-max mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-xl"
      >
        <p className="font-label-md text-label-md text-primary mb-sm">
          {t("landingFeatures.pricingLabel")}
        </p>
        <h2 className="font-display-md text-display-md text-on-surface font-bold mb-md">
          {t("landingFeatures.pricingTitle")}
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
          {t("landingFeatures.pricingSubtitle")}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        {highlights.map((item, i) => (
          <motion.div
            key={item.exam}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface border border-outline-variant rounded-2xl p-lg text-center shadow-violet-sm"
          >
            <h3 className="font-label-md text-label-md font-bold text-on-surface mb-sm">
              {item.exam}
            </h3>
            <p className="font-display-md text-[28px] text-primary font-bold">
              {t("landingFeatures.pricingFrom", { price: item.from })}
            </p>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
              {t("landingFeatures.pricingDays", { days: item.days })}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="text-center flex flex-col sm:flex-row gap-md justify-center">
        <Button asChild size="xl">
          <Link href="/preparation/tcf">
            {t("landingFeatures.tryFree")}
            <span className="material-symbols-outlined">play_arrow</span>
          </Link>
        </Button>
        <Button asChild variant="secondary" size="xl">
          <Link href="/offres">
            {t("landingFeatures.viewAllOffers")}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
