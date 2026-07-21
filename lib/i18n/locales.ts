import type { AppLocale } from "@/lib/i18n/types";
export type { AppLocale } from "./types";

export const DEFAULT_LOCALE: AppLocale = "fr-FR";
export const LOCALE_COOKIE = "oc-locale";

/** Map BDD / paramètres utilisateur → locale app */
export function parseAppLocale(value: string | null | undefined): AppLocale {
  if (value === "fr-FR" || value === "fr-CA" || value === "en-CA") return value;
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "fr-fr") return "fr-FR";
  if (normalized === "fr-ca") return "fr-CA";
  if (normalized === "en-ca" || normalized === "en") return "en-CA";
  return DEFAULT_LOCALE;
}
/** Locale app → valeur stockée en BDD */
export function localeToStorage(locale: AppLocale): string {
  return locale;
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  "fr-FR": "Français (France)",
  "fr-CA": "Français (Canada)",
  "en-CA": "English (Canada)",
};

export const SUPPORTED_LOCALES: AppLocale[] = ["fr-FR", "fr-CA", "en-CA"];

export function localeToHtmlLang(locale: AppLocale): string {
  return locale;
}
