"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/locale-provider";
import { fetchJson } from "@/lib/api/fetch-json";
import { EXAM_TYPE_LABELS } from "@/lib/exams/catalog";
import {
  EXAM_TYPE_TO_TAB,
  type PricingOffer,
} from "@/lib/pricing/constants";
import { cn } from "@/lib/utils";

interface FeaturedOffersResponse {
  offers: PricingOffer[];
}

export function PricingTeaser() {
  const { t } = useTranslation();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["offers", "featured-home"],
    queryFn: () =>
      fetchJson<FeaturedOffersResponse>("/api/offres?all=1"),
  });

  const offers = data?.offers ?? [];

  const gridClass =
    offers.length === 1
      ? "grid-cols-1 max-w-md mx-auto"
      : offers.length === 2
        ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-40 rounded-2xl border border-outline-variant bg-surface-container-low animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <p className="text-center text-on-surface-variant mb-xl">
          Impossible de charger les offres pour le moment.
        </p>
      ) : offers.length === 0 ? (
        <p className="text-center text-on-surface-variant mb-xl">
          Aucune offre visible pour le moment. Consultez la page offres pour
          plus d&apos;informations.
        </p>
      ) : (
        <div className={cn("grid gap-md mb-xl", gridClass)}>
          {offers.map((offer, i) => {
            const examLabel =
              EXAM_TYPE_LABELS[
                offer.examType as keyof typeof EXAM_TYPE_LABELS
              ] ?? offer.examType;
            const examTab =
              EXAM_TYPE_TO_TAB[
                offer.examType as keyof typeof EXAM_TYPE_TO_TAB
              ] ?? "tcf";
            const totalDays = offer.baseDays + offer.bonusDays;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.06, 0.3) }}
              >
                <Link
                  href={`/offres?examen=${examTab}`}
                  className="block h-full bg-surface border border-outline-variant rounded-2xl p-lg text-center shadow-violet-sm hover:border-primary/40 hover:shadow-md transition-all"
                >
                  <p className="font-label-sm text-[11px] uppercase tracking-wider text-primary font-semibold mb-xs">
                    {examLabel}
                  </p>
                  <h3 className="font-label-md text-label-md font-bold text-on-surface mb-sm">
                    {offer.name}
                  </h3>
                  {offer.subtitle && (
                    <p className="font-label-sm text-[12px] text-on-surface-variant mb-sm line-clamp-2">
                      {offer.subtitle}
                    </p>
                  )}
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-xs">
                    {totalDays} jour{totalDays > 1 ? "s" : ""}
                    {offer.bonusDays > 0
                      ? ` (${offer.baseDays}+${offer.bonusDays})`
                      : ""}
                  </p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

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
