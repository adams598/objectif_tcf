import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string, locale = "fr-CA"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h${m.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatScore(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  return `${Math.round(percentage)}%`;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function nclcToLevel(nclc: number): string {
  if (nclc <= 2) return "A1";
  if (nclc <= 4) return "A2";
  if (nclc <= 6) return "B1";
  if (nclc <= 8) return "B2";
  if (nclc <= 10) return "C1";
  return "C2";
}

export function levelToColor(level: string): string {
  const colors: Record<string, string> = {
    A1: "text-error",
    A2: "text-error",
    B1: "text-tertiary",
    B2: "text-tertiary",
    C1: "text-primary",
    C2: "text-success",
  };
  return colors[level] ?? "text-on-surface-variant";
}

export function skillLabel(skill: string): string {
  const labels: Record<string, string> = {
    COMPREHENSION_ORALE: "Compréhension Orale",
    COMPREHENSION_ECRITE: "Compréhension Écrite",
    EXPRESSION_ECRITE: "Expression Écrite",
    EXPRESSION_ORALE: "Expression Orale",
    LEXIQUE: "Lexique",
  };
  return labels[skill] ?? skill;
}

export function skillAbbrev(skill: string): string {
  const abbrevs: Record<string, string> = {
    COMPREHENSION_ORALE: "CO",
    COMPREHENSION_ECRITE: "CE",
    EXPRESSION_ECRITE: "EE",
    EXPRESSION_ORALE: "EO",
    LEXIQUE: "LEX",
  };
  return abbrevs[skill] ?? skill;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
