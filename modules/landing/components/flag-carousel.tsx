"use client";

import React from "react";

const countries = [
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇨🇩", name: "RDC" },
  { flag: "🇨🇮", name: "Côte d'Ivoire" },
  { flag: "🇸🇳", name: "Sénégal" },
  { flag: "🇲🇦", name: "Maroc" },
  { flag: "🇨🇲", name: "Cameroun" },
  { flag: "🇲🇬", name: "Madagascar" },
  { flag: "🇭🇹", name: "Haïti" },
];

export function FlagCarousel() {
  const doubled = [...countries, ...countries];

  return (
    <section className="py-xl bg-surface-container-low border-y border-surface-variant overflow-hidden">
      <div className="max-w-container-max mx-auto px-md mb-md text-center">
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          Ils préparent leur avenir depuis
        </p>
      </div>
      <div className="relative w-full overflow-hidden whitespace-nowrap">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-surface-container-low to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-surface-container-low to-transparent z-10 pointer-events-none" />

        <div className="carousel-track inline-flex items-center gap-xl px-xl">
          {doubled.map((country, index) => (
            <div
              key={`${country.name}-${index}`}
              className="flex items-center gap-sm px-md py-sm bg-surface rounded-full border border-surface-variant shadow-sm w-[180px] justify-center shrink-0"
            >
              <span className="text-2xl">{country.flag}</span>
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                {country.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
