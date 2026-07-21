"use client";

import React, { useMemo, useState } from "react";
import { getFaqContent } from "@/lib/marketing/content/faq";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import { useTranslation } from "@/components/providers/locale-provider";

export function FaqPage() {
  const { locale } = useTranslation();
  const content = getFaqContent(locale);
  const [search, setSearch] = useState("");

  const visibleCategories = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return content.categories;

    return content.categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.question.toLowerCase().includes(query) ||
            item.answer.toLowerCase().includes(query)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [content.categories, search]);

  return (
    <MarketingPageShell narrow>
      <MarketingPageHero
        title={content.title}
        subtitle={content.subtitle}
      />

      <div className="relative mb-xl">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={content.searchPlaceholder}
          className="w-full pl-12 pr-md py-md rounded-xl border border-outline-variant bg-surface font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-2xl">
        {visibleCategories.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant text-center py-xl">
            Aucun résultat pour « {search} »
          </p>
        ) : (
          visibleCategories.map((category) => (
            <section key={category.id}>
              <h2 className="font-label-md text-label-md font-bold text-primary uppercase tracking-wide mb-md">
                {category.title}
              </h2>
              <FaqAccordion items={category.items} />
            </section>
          ))
        )}
      </div>
    </MarketingPageShell>
  );
}
