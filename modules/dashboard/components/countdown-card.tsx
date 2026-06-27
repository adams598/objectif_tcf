"use client";

import React, { useState, useEffect } from "react";

const EXAM_DATE = new Date("2024-11-15");

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function CountdownCard() {
  const [daysLeft, setDaysLeft] = useState(42);

  useEffect(() => {
    setDaysLeft(getDaysUntil(EXAM_DATE));
  }, []);

  return (
    <div className="bg-gradient-to-br from-primary to-primary-container rounded-2xl p-lg text-on-primary shadow-violet-md relative overflow-hidden">
      {/* Decorative icon */}
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <span className="material-symbols-outlined text-[64px]">event_available</span>
      </div>

      <h3 className="font-label-md text-label-md text-primary-fixed mb-sm uppercase tracking-wider">
        Examen TCF Canada
      </h3>

      <div className="flex items-baseline gap-sm mb-lg">
        <span className="font-display-lg text-display-lg leading-none">
          {daysLeft}
        </span>
        <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary/70">
          Jours
        </span>
      </div>

      <div className="bg-on-primary/10 rounded-xl p-md border border-on-primary/20 backdrop-blur-sm space-y-sm">
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-primary/70">
            Date prévue
          </span>
          <span className="font-label-sm text-label-sm font-bold">
            15 Nov 2024
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-on-primary/70">
            Centre
          </span>
          <span className="font-label-sm text-label-sm text-right">
            Alliance Française
            <br />
            Paris
          </span>
        </div>
      </div>
    </div>
  );
}
