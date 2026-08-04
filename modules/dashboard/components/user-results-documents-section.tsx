"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchJson } from "@/lib/api/fetch-json";
import { downloadResultPdfByAttemptId } from "@/lib/examen/download-result-pdf";
import { percentageToCecr } from "@/lib/examen/scoring";
import { nclcLevelToNumber } from "@/lib/dashboard/stats";
import { useTranslation } from "@/components/providers/locale-provider";

interface ResultAttempt {
  id: string;
  score: number | null;
  percentage: number | null;
  nclcLevel: string | null;
  completedAt: string | null;
  series: { title: string; skill: string; difficulty: string };
}

interface ResultsResponse {
  attempts: ResultAttempt[];
}

const SKILL_ABBREV: Record<string, string> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
};

export function UserResultsDocumentsSection() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ["resultats"],
    queryFn: () => fetchJson<ResultsResponse>("/api/resultats"),
  });

  const attempts = data?.attempts ?? [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-surface border border-outline-variant rounded-2xl p-lg shadow-violet-sm"
    >
      <div className="flex items-center gap-sm mb-lg">
        <span className="material-symbols-outlined text-primary">
          assignment
        </span>
        <div>
          <h2 className="font-headline-lg text-[22px] font-semibold text-on-surface">
            {t("documents.resultsSectionTitle")}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
            {t("documents.resultsSectionDesc")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-sm">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-24 rounded-xl bg-surface-container animate-pulse"
            />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          icon="analytics"
          title={t("documents.noResultsTitle")}
          description={t("documents.noResultsDesc")}
          action={
            <Button asChild size="sm">
              <Link href="/series">{t("nav.series")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-md">
          {attempts.map((attempt) => {
            const pct = Math.round(attempt.percentage ?? 0);
            const cecr = percentageToCecr(pct);
            const nclc = nclcLevelToNumber(attempt.nclcLevel as never);
            const skill = SKILL_ABBREV[attempt.series.skill] ?? attempt.series.skill;
            const dateLabel = attempt.completedAt
              ? new Date(attempt.completedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "—";

            return (
              <div
                key={attempt.id}
                className="rounded-xl border border-outline-variant bg-surface-container-low p-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-md">
                  <div>
                    <p className="font-label-md text-label-md font-bold text-on-surface">
                      {attempt.series.title}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      {skill} · {dateLabel}
                    </p>
                    <p className="font-label-sm text-label-sm text-primary font-semibold mt-sm">
                      {pct}% · CECRL {cecr}
                      {nclc > 0 ? ` · NCLC ${nclc}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-sm">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/resultats?skill=${skill}`}>
                        <span className="material-symbols-outlined text-[18px]">
                          visibility
                        </span>
                        {t("documents.viewResult")}
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        void downloadResultPdfByAttemptId(
                          attempt.id,
                          `resultat-${skill}-${attempt.series.title}`
                        ).catch(() => toast.error(t("documents.downloadError")))
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        picture_as_pdf
                      </span>
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
