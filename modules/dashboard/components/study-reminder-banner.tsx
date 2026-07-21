"use client";



import React from "react";

import { motion } from "framer-motion";

import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

import { useTranslation } from "@/components/providers/locale-provider";



export function StudyReminderBanner() {

  const { t } = useTranslation();

  const { data } = useDashboardStats((stats) => stats.dailyGoal);



  const goalMinutes = data?.goalMinutes ?? 30;

  const currentMinutes = data?.currentMinutes ?? 0;

  const remaining = Math.max(0, goalMinutes - currentMinutes);



  if (remaining === 0) return null;



  return (

    <motion.div

      initial={{ opacity: 0, y: -8 }}

      animate={{ opacity: 1, y: 0 }}

      className="flex items-center gap-md rounded-2xl border border-primary/20 bg-primary/5 px-md py-sm"

    >

      <span

        className="material-symbols-outlined text-primary"

        style={{ fontVariationSettings: "'FILL' 1" }}

      >

        alarm

      </span>

      <p className="font-body-md text-body-md text-on-surface">

        {t("dashboardCards.studyReminder")}

      </p>

    </motion.div>

  );

}


