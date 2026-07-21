import type { NCLCLevel, Skill } from "@prisma/client";

export const SKILL_ABBREV: Record<Skill, string> = {
  COMPREHENSION_ORALE: "CO",
  COMPREHENSION_ECRITE: "CE",
  EXPRESSION_ECRITE: "EE",
  EXPRESSION_ORALE: "EO",
  LEXIQUE: "LEX",
};

export const ABBREV_TO_SKILL: Record<string, Skill> = {
  CO: "COMPREHENSION_ORALE",
  CE: "COMPREHENSION_ECRITE",
  EE: "EXPRESSION_ECRITE",
  EO: "EXPRESSION_ORALE",
  LEX: "LEXIQUE",
};

export const DASHBOARD_SKILLS = ["CO", "CE", "EE", "EO"] as const;

export function nclcLevelToNumber(level: NCLCLevel | null | undefined): number {
  if (!level) return 0;
  const match = level.match(/NCLC_(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export function getStartOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getStartOfWeek(date = new Date()): Date {
  const d = getStartOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function formatRelativeTime(date: Date, locale = "fr-FR"): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffMin < 1) return rtf.format(0, "second");
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  if (diffHours < 24) return rtf.format(-diffHours, "hour");
  if (diffDays < 7) return rtf.format(-diffDays, "day");

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}

export function formatMessageTime(date: Date, locale = "fr-FR"): string {
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    return rtf.format(-1, "day");
  }

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  });
}
