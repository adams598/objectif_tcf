"use client";



import React from "react";

import { useDashboardStats } from "@/lib/hooks/use-dashboard-stats";

import { useTranslation } from "@/components/providers/locale-provider";



const DAY_KEYS = [

  "dashboardCards.dayMon",

  "dashboardCards.dayTue",

  "dashboardCards.dayWed",

  "dashboardCards.dayThu",

  "dashboardCards.dayFri",

  "dashboardCards.daySat",

  "dashboardCards.daySun",

] as const;



interface DailyGoalCardProps {

  showReminder?: boolean;

}



export function DailyGoalCard({ showReminder = true }: DailyGoalCardProps) {

  const { t } = useTranslation();

  const { data, isLoading } = useDashboardStats((stats) => stats.dailyGoal);



  const currentMinutes = data?.currentMinutes ?? 0;

  const goalMinutes = data?.goalMinutes ?? 30;

  const completedWeekDays = data?.completedWeekDays ?? [];

  const percentage =

    goalMinutes > 0 ? Math.min(100, (currentMinutes / goalMinutes) * 100) : 0;

  const circumference = 2 * Math.PI * 40;

  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const remaining = Math.max(0, goalMinutes - currentMinutes);

  const todayIndex = (new Date().getDay() + 6) % 7;



  if (isLoading) {

    return (

      <div className="bg-surface rounded-2xl border border-outline-variant p-lg h-80 animate-pulse" />

    );

  }



  return (

    <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm flex-1 flex flex-col">

      <div className="flex justify-between items-center mb-lg">

        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">

          {t("dashboardCards.dailyGoal")}

        </h3>

        <span className="material-symbols-outlined text-tertiary-container text-[28px]">

          local_fire_department

        </span>

      </div>



      {showReminder && remaining > 0 && (

        <div className="mb-md rounded-xl bg-tertiary-container/20 border border-tertiary-container/30 px-sm py-xs text-center">

          <p className="font-label-sm text-label-sm text-on-surface-variant">

            {t("dashboardCards.reminderLeft", { min: remaining })}

          </p>

        </div>

      )}



      <div className="relative w-32 h-32 mx-auto mb-lg">

        <svg

          className="w-full h-full -rotate-90"

          viewBox="0 0 100 100"

          aria-label={t("dashboardCards.goalProgress", {

            current: currentMinutes,

            goal: goalMinutes,

          })}

        >

          <circle

            cx="50"

            cy="50"

            r="40"

            fill="none"

            stroke="var(--outline-variant)"

            strokeWidth="8"

          />

          <circle

            cx="50"

            cy="50"

            r="40"

            fill="none"

            stroke="var(--tertiary-container)"

            strokeWidth="8"

            strokeDasharray={circumference}

            strokeDashoffset={strokeDashoffset}

            strokeLinecap="round"

            style={{ transition: "stroke-dashoffset 1s ease" }}

          />

        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">

          <span className="font-headline-lg text-headline-lg text-on-surface leading-none">

            {currentMinutes}

          </span>

          <span className="font-label-sm text-label-sm text-on-surface-variant">

            min

          </span>

        </div>

      </div>



      <p className="text-center font-body-md text-body-md text-on-surface-variant mb-md">

        {currentMinutes >= goalMinutes

          ? t("dashboardCards.goalReached")

          : remaining > 0

            ? t("dashboardCards.goalRemaining", { remaining })

            : t("dashboardCards.goalStartToday")}

      </p>



      <div className="mt-auto flex justify-center gap-sm">

        {DAY_KEYS.map((dayKey, index) => {

          const isCompleted = completedWeekDays.includes(index);

          const isToday = index === todayIndex;



          return (

            <div

              key={dayKey}

              className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold relative ${

                isCompleted

                  ? "bg-tertiary-container text-on-tertiary-container"

                  : "bg-surface-container-highest text-on-surface-variant"

              }`}

            >

              {t(dayKey)}

              {isToday && (

                <span className="absolute -bottom-1 w-1 h-1 bg-on-surface rounded-full" />

              )}

            </div>

          );

        })}

      </div>

    </div>

  );

}


