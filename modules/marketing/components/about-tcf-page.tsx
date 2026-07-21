"use client";

import React from "react";
import Link from "next/link";
import { getAboutTcfContent } from "@/lib/marketing/content/about-tcf";
import { ContentAccordion } from "@/components/marketing/content-accordion";
import { UsefulLinksSection } from "@/components/marketing/useful-links-section";
import {
  DataTable,
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import { useTranslation } from "@/components/providers/locale-provider";

export function AboutTcfPage() {
  const { locale } = useTranslation();
  const content = getAboutTcfContent(locale);

  return (
    <MarketingPageShell>
      <MarketingPageHero
        title={content.heroTitle}
        highlight={content.heroHighlight}
      />

      <div className="space-y-2xl">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="font-headline-lg text-[22px] text-on-surface font-bold mb-md">
              {section.title}
            </h2>

            {section.paragraphs?.map((p, i) => (
              <p
                key={i}
                className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-md"
              >
                {p}
              </p>
            ))}

            {section.quote && (
              <blockquote className="border-l-4 border-primary pl-md my-md font-body-md text-body-md italic text-on-surface">
                « {section.quote} »
              </blockquote>
            )}

            {section.numberedList && (
              <ol className="list-decimal list-inside space-y-sm mb-md font-body-md text-body-md text-on-surface-variant">
                {section.numberedList.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ol>
            )}

            {section.list && section.id === "resultats" && (
              <>
                <p className="font-body-md text-body-md text-on-surface-variant mb-sm">
                  Chaque candidat reçoit une attestation qui comporte :
                </p>
                <ol className="list-decimal list-inside space-y-sm mb-md font-body-md text-body-md text-on-surface-variant">
                  {section.list.map((item, i) => (
                    <li key={i} className="leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ol>
              </>
            )}

            {section.table && (
              <DataTable
                title={section.table.title}
                headers={section.table.headers}
                rows={section.table.rows}
                className="mb-md"
              />
            )}

            {section.accordions && (
              <ContentAccordion items={section.accordions} />
            )}

            {section.usefulLinks && (
              <UsefulLinksSection block={section.usefulLinks} />
            )}

            {section.linkBox && (
              <Link
                href={section.linkBox.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-md px-lg py-md rounded-xl bg-surface-container border border-outline-variant font-label-md text-label-md font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                {section.linkBox.label}
              </Link>
            )}
          </section>
        ))}
      </div>
    </MarketingPageShell>
  );
}
