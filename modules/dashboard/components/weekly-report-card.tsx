"use client";



import React from "react";

import { motion } from "framer-motion";

import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

import { useTranslation } from "@/components/providers/locale-provider";



const SKILL_KEY_MAP: Record<string, "co" | "ce" | "ee" | "eo"> = {

  CO: "co",

  CE: "ce",

  EE: "ee",

  EO: "eo",

};



export function WeeklyReportCard() {

  const { t } = useTranslation();

  const { data, isLoading } = useDashboardStats((stats) => stats.weeklyReport);



  if (isLoading) {

    return (

      <div className="bg-surface rounded-2xl border border-outline-variant p-lg h-24 animate-pulse" />

    );

  }



  const sessions = data?.sessionsCompleted ?? 0;

  const topSkill = data?.topSkill;

  const topSkillPoints = data?.topSkillPoints ?? 0;



  const skillLabel =

    topSkill && SKILL_KEY_MAP[topSkill]

      ? t(`skills.${SKILL_KEY_MAP[topSkill]}`)

      : topSkill;



  return (

    <motion.div

      initial={{ opacity: 0, y: 10 }}

      animate={{ opacity: 1, y: 0 }}

      className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm"

    >

      <div className="flex items-start gap-md">

        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">

          <span className="material-symbols-outlined text-primary">insights</span>

        </div>

        <div>

          <h3 className="font-label-md text-label-md text-on-surface font-semibold">

            {t("dashboardCards.weeklyReport")}

          </h3>

          {sessions === 0 ? (

            <p className="font-body-md text-body-md text-on-surface-variant mt-xs">

              {t("dashboardCards.weeklyNoActivity")}

            </p>

          ) : (

            <div className="font-body-md text-body-md text-on-surface-variant mt-xs space-y-xs">

              <p>{t("dashboardCards.weeklySessions", { count: sessions })}</p>

              {topSkill && topSkillPoints > 0 && skillLabel && (

                <p>

                  {t("dashboardCards.weeklyTopSkill", {

                    skill: skillLabel,

                    points: topSkillPoints,

                  })}

                </p>

              )}

            </div>

          )}

        </div>

      </div>

    </motion.div>

  );

}


