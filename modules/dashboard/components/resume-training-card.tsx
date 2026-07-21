"use client";



import React from "react";

import Link from "next/link";

import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";

import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

import { useTranslation } from "@/components/providers/locale-provider";



interface InProgressAttempt {

  id: string;

  seriesId: string;

  title: string;

  description: string | null;

  skill: string;

}



const skillIcons: Record<string, string> = {

  CO: "headphones",

  CE: "auto_stories",

  EE: "edit_note",

  EO: "mic",

  LEX: "translate",

};



export function ResumeTrainingCard() {

  const { t } = useTranslation();

  const { data, isLoading } = useDashboardStats(

    (stats) => stats.inProgressAttempt

  );



  if (isLoading) {

    return (

      <div className="bg-surface rounded-2xl border border-outline-variant p-lg h-28 animate-pulse" />

    );

  }



  if (!data) {

    return (

      <EmptyState

        icon="play_circle"

        title={t("dashboardCards.noSession")}

        description={t("dashboardCards.noSessionDesc")}

        action={

          <Button asChild>

            <Link href="/series">

              {t("dashboardCards.browseSeries")}

              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>

            </Link>

          </Button>

        }

      />

    );

  }



  return (

    <motion.div

      whileHover={{ borderColor: "rgba(207, 188, 255, 0.8)" }}

      className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm flex flex-col sm:flex-row items-center justify-between gap-lg relative overflow-hidden group"

    >

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-container to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out opacity-50 pointer-events-none" />



      <div className="flex items-center gap-lg z-10 w-full sm:w-auto">

        <div className="w-16 h-16 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">

          <span className="material-symbols-outlined text-[30px]">

            {skillIcons[data.skill] ?? "school"}

          </span>

        </div>



        <div>

          <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">

            {t("dashboardCards.resumeTraining")}

          </span>

          <h4 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mt-1">

            {data.title}

          </h4>

          {data.description && (

            <p className="font-body-md text-body-md text-on-surface-variant">

              {data.description}

            </p>

          )}

        </div>

      </div>



      <Button asChild size="lg" className="w-full sm:w-auto shrink-0 z-10">

        <Link href={`/examen/serie/${data.seriesId}`}>

          {t("dashboardCards.continue")}

          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>

        </Link>

      </Button>

    </motion.div>

  );

}


