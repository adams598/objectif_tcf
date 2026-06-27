"use client";

import React from "react";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const COMPLETED_DAYS = [0, 1, 2]; // Index of completed days

const currentMinutes = 45;
const goalMinutes = 60;
const percentage = (currentMinutes / goalMinutes) * 100;
const circumference = 2 * Math.PI * 40;
const strokeDashoffset = circumference - (percentage / 100) * circumference;

export function DailyGoalCard() {
  return (
    <div className="bg-surface rounded-2xl border border-outline-variant p-lg shadow-sm flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-lg">
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
          Objectif Journalier
        </h3>
        <span className="material-symbols-outlined text-tertiary-container text-[28px]">
          local_fire_department
        </span>
      </div>

      {/* Circular Progress */}
      <div className="relative w-32 h-32 mx-auto mb-lg">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 100 100"
          aria-label={`Progression : ${currentMinutes} sur ${goalMinutes} minutes`}
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#e6e0e9"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#c9a74d"
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
        Encore {goalMinutes - currentMinutes} minutes pour atteindre votre objectif quotidien.
      </p>

      {/* Week streak */}
      <div className="mt-auto flex justify-center gap-sm">
        {DAYS.map((day, index) => {
          const isCompleted = COMPLETED_DAYS.includes(index);
          const isToday = index === 2;

          return (
            <div
              key={`${day}-${index}`}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold relative ${
                isCompleted
                  ? "bg-tertiary-container text-on-tertiary-container"
                  : "bg-surface-container-highest text-on-surface-variant"
              }`}
            >
              {day}
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
