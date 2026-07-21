"use client";



import React from "react";

import Link from "next/link";

import { Button } from "@/components/ui/button";

import { EXAM_TYPE_TO_TAB } from "@/lib/pricing/constants";

import { formatExamDateDisplay } from "@/lib/user/exam-date";

import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

import { useTranslation } from "@/components/providers/locale-provider";

import type { ExamTab } from "@/lib/pricing/constants";

import type { ExamType } from "@prisma/client";



function getExamLabel(

  examType: ExamType | undefined,

  t: (key: string) => string

): string {

  if (!examType) return t("exams.tcf");

  const tab = EXAM_TYPE_TO_TAB[examType] as ExamTab;

  return t(`exams.${tab}`);

}



export function CountdownCard() {

  const { t } = useTranslation();

  const { data, isLoading } = useDashboardStats((stats) => stats.exam);



  if (isLoading) {

    return (

      <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg h-56 animate-pulse opacity-70" />

    );

  }



  if (!data?.hasExamDate) {

    return (

      <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg text-on-primary shadow-violet-md relative overflow-hidden">

        <div className="absolute top-0 right-0 p-4 opacity-20">

          <span className="material-symbols-outlined text-[64px]">event_busy</span>

        </div>

        <h3 className="font-label-md text-label-md text-primary-fixed mb-sm uppercase tracking-wider">

          {getExamLabel(data?.examType, t)}

        </h3>

        <p className="font-body-md text-body-md text-on-primary/90 mb-lg">

          {t("dashboardCards.countdownNoDate")}

        </p>

        <Button asChild variant="secondary" size="sm">

          <Link href="/parametres">{t("dashboardCards.setExamDate")}</Link>

        </Button>

      </div>

    );

  }



  const formattedDate = formatExamDateDisplay(data.targetExamDate!);



  return (

    <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg text-on-primary shadow-violet-md relative overflow-hidden">

      <div className="absolute top-0 right-0 p-4 opacity-20">

        <span className="material-symbols-outlined text-[64px]">event_available</span>

      </div>



      <h3 className="font-label-md text-label-md text-primary-fixed mb-sm uppercase tracking-wider">

        {getExamLabel(data.examType, t)}

      </h3>



      <div className="flex items-baseline gap-sm mb-lg">

        <span className="font-display-lg text-display-lg leading-none">

          {data.daysLeft ?? 0}

        </span>

        <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary/70">

          {t("dashboardCards.days")}

        </span>

      </div>



      <div className="bg-on-primary/10 rounded-xl p-md border border-on-primary/20 backdrop-blur-sm space-y-sm">

        <div className="flex items-center justify-between">

          <span className="font-label-sm text-label-sm text-on-primary/70">

            {t("dashboardCards.plannedDate")}

          </span>

          <span className="font-label-sm text-label-sm font-bold">

            {formattedDate}

          </span>

        </div>

        {data.targetCountry && (

          <div className="flex items-center justify-between">

            <span className="font-label-sm text-label-sm text-on-primary/70">

              {t("dashboardCards.destination")}

            </span>

            <span className="font-label-sm text-label-sm text-right">

              {data.targetCountry}

            </span>

          </div>

        )}

      </div>

    </div>

  );

}


