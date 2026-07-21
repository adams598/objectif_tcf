"use client";

import React from "react";
import { motion } from "framer-motion";
import { CompetencyRadar } from "./competency-radar";
import { SkillGapsCard } from "./skill-gaps-card";
import { CountdownCard } from "./countdown-card";
import { DailyGoalCard } from "./daily-goal-card";
import { ResumeTrainingCard } from "./resume-training-card";
import { WeeklyReportCard } from "./weekly-report-card";
import { StudyReminderBanner } from "./study-reminder-banner";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { useTranslation } from "@/components/providers/locale-provider";
import { IMMIGRATION_LABELS, TARGET_COUNTRY_LABELS } from "@/lib/user/profile";

export function DashboardView() {
  const { notificationPreferences } = useUserPreferences();
  const { firstName, profile, isLoading } = useCurrentUser();
  const { t } = useTranslation();

  const targetLabel = profile?.targetCountry
    ? TARGET_COUNTRY_LABELS[profile.targetCountry] ?? profile.targetCountry
    : profile?.immigrationObjective
      ? IMMIGRATION_LABELS[profile.immigrationObjective]
      : "Canada";

  return (
    <div className="flex flex-col gap-xl">
      {notificationPreferences.studyReminders && <StudyReminderBanner />}

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md"
      >
        <div>
          <h1 className="font-display-md text-display-md text-on-surface">
            {isLoading
              ? t("dashboard.greetingLoading")
              : t("dashboard.greeting", { name: firstName })}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-md">
          <NotificationBell />

          <div className="flex items-center gap-sm bg-surface px-md py-sm rounded-full border border-outline-variant shadow-sm">
            <span className="text-lg">🇨🇦</span>
            <span className="font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">
              {t("dashboard.target")}: {targetLabel}
            </span>
          </div>
        </div>
      </motion.header>

      {notificationPreferences.weeklyReportNotifications && (
        <WeeklyReportCard />
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <div className="md:col-span-8 flex flex-col gap-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <CompetencyRadar />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <SkillGapsCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <ResumeTrainingCard />
          </motion.div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-lg">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <CountdownCard />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
            <DailyGoalCard showReminder={notificationPreferences.studyReminders} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
