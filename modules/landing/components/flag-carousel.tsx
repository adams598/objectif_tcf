"use client";

import Image from "next/image";
import { useTranslation } from "@/components/providers/locale-provider";

const COUNTRIES = [
  { code: "ca", nameKey: "landingFeatures.countryCanada" as const },
  { code: "cd", nameKey: "landingFeatures.countryRdc" as const },
  { code: "ci", nameKey: "landingFeatures.countryCoteIvoire" as const },
  { code: "sn", nameKey: "landingFeatures.countrySenegal" as const },
  { code: "ma", nameKey: "landingFeatures.countryMaroc" as const },
  { code: "cm", nameKey: "landingFeatures.countryCameroun" as const },
  { code: "mg", nameKey: "landingFeatures.countryMadagascar" as const },
  { code: "ht", nameKey: "landingFeatures.countryHaiti" as const },
];

function FlagIcon({ code }: { code: string }) {
  return (
    <Image
      src={`https://flagcdn.com/w40/${code}.png`}
      alt=""
      width={28}
      height={20}
      className="h-5 w-7 shrink-0 rounded-sm object-cover shadow-sm"
      unoptimized
    />
  );
}

export function FlagCarousel() {
  const { t } = useTranslation();
  const doubled = [...COUNTRIES, ...COUNTRIES];

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
              key={`${country.code}-${index}`}
              className="flex items-center gap-sm px-md py-sm bg-surface rounded-full border border-surface-variant shadow-sm w-[180px] justify-center shrink-0"
            >
              <FlagIcon code={country.code} />
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                {t(country.nameKey)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
