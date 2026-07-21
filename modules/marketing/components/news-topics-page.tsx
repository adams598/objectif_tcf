"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";
import { useTranslation } from "@/components/providers/locale-provider";

const TOPICS = [
  {
    exam: "TCF Canada",
    title: "Immigration économique au Québec",
    tag: "Immigration",
    href: "/preparation/tcf",
  },
  {
    exam: "TCF Canada",
    title: "Citoyenneté canadienne : parcours et exigences",
    tag: "Citoyenneté",
    href: "/preparation/tcf",
  },
  {
    exam: "TEF Canada",
    title: "Entrée Express : maximiser ses points linguistiques",
    tag: "Entrée Express",
    href: "/preparation/tef",
  },
  {
    exam: "IELTS",
    title: "Études au Canada : IELTS Academic vs General",
    tag: "Études",
    href: "/preparation/ielts",
  },
  {
    exam: "TCF Canada",
    title: "Vie quotidienne au Canada francophone",
    tag: "Culture",
    href: "/preparation/tcf",
  },
  {
    exam: "TEF Canada",
    title: "Emploi et reconnaissance des diplômes",
    tag: "Emploi",
    href: "/preparation/tef",
  },
];

export function NewsTopicsPage() {
  const { t } = useTranslation();

  return (
    <MarketingPageShell>
      <MarketingPageHero
        title={t("marketingPages.news.title")}
        subtitle={t("marketingPages.news.subtitle")}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-2xl">
        {TOPICS.map((topic) => (
          <Link
            key={topic.title}
            href={topic.href}
            className="group bg-surface rounded-2xl p-lg border border-outline-variant shadow-violet-sm hover:border-primary/40 hover:shadow-violet-md transition-all"
          >
            <div className="flex items-center gap-sm mb-sm">
              <Badge variant="default">{topic.exam}</Badge>
              <Badge variant="outline">{topic.tag}</Badge>
            </div>
            <h3 className="font-label-md text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
              {topic.title}
            </h3>
          </Link>
        ))}
      </div>

      <div className="text-center bg-gradient-to-br from-primary/10 to-primary-container/10 rounded-2xl p-xl border border-outline-variant">
        <p className="font-body-md text-body-md text-on-surface-variant mb-md">
          {t("marketingPages.news.ctaDesc")}
        </p>
        <Button asChild>
          <Link href="/offres">{t("layout.pricing")}</Link>
        </Button>
      </div>
    </MarketingPageShell>
  );
}
