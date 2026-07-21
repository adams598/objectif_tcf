"use client";

import React from "react";
import { useTranslation } from "@/components/providers/locale-provider";

export function FlagCarousel() {
  const { t } = useTranslation();

  const countries = [
    { flag: "🇨🇦", nameKey: "landingFeatures.countryCanada" as const },
    { flag: "🇨🇩", nameKey: "landingFeatures.countryRdc" as const },
    { flag: "🇨🇮", nameKey: "landingFeatures.countryCoteIvoire" as const },
    { flag: "🇸🇳", nameKey: "landingFeatures.countrySenegal" as const },
    { flag: "🇲🇦", nameKey: "landingFeatures.countryMaroc" as const },
    { flag: "🇨🇲", nameKey: "landingFeatures.countryCameroun" as const },
    { flag: "🇲🇬", nameKey: "landingFeatures.countryMadagascar" as const },
    { flag: "🇭🇹", nameKey: "landingFeatures.countryHaiti" as const },
  ];

  const doubled = [...countries, ...countries];

  return (
    <section className="py-xl bg-surface-container-low border-y border-surface-variant overflow-hidden">
      <div className="max-w-container-max mx-auto px-md mb-md text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          {t("landingFeatures.flagCarouselLabel")}
        </p>
      </div>
      <div className="relative w-full overflow-hidden whitespace-nowrap">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-container-low to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-container-low to-transparent z-10 pointer-events-none" />

        <div className="carousel-track inline-flex items-center gap-xl px-xl">
          {doubled.map((country, index) => (
            <div
              key={`${country.nameKey}-${index}`}
              className="flex items-center gap-sm px-md py-sm bg-surface rounded-full border border-surface-variant shadow-sm w-[180px] justify-center shrink-0"
            >
              <span className="text-2xl">{country.flag}</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                {t(country.nameKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
