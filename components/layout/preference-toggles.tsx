"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useLocale, useTranslation } from "@/components/providers/locale-provider";
import { useTheme, type Theme } from "@/components/providers/theme-provider";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  localeToStorage,
  type AppLocale,
} from "@/lib/i18n/locales";
import { useAuthSession } from "@/lib/hooks/use-auth-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PreferenceTogglesProps {
  compact?: boolean;
  className?: string;
}

export function PreferenceToggles({
  compact = false,
  className,
}: PreferenceTogglesProps) {
  const { locale, setLocale } = useLocale();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { data: session } = useAuthSession();

  const persistSettings = async (payload: Record<string, string | boolean>) => {
    if (!session) return;
    try {
      await fetch("/api/utilisateurs/parametres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // Les invités et les erreurs réseau conservent cookie/localStorage.
    }
  };

  const handleLocaleChange = async (next: AppLocale) => {
    setLocale(next);
    await persistSettings({ language: localeToStorage(next) });
  };

  const handleThemeToggle = async () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    await persistSettings({ theme: next });
  };

  const localeShort =
    locale === "en-CA" ? "EN" : locale === "fr-CA" ? "FR-CA" : "FR";

  return (
    <div className={cn("flex items-center gap-xs", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface px-sm py-1.5 font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors",
              compact && "px-2"
            )}
            aria-label={t("preferences.changeLanguage")}
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            {!compact ? <span>{localeShort}</span> : null}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {SUPPORTED_LOCALES.map((value) => (
            <DropdownMenuItem
              key={value}
              onClick={() => void handleLocaleChange(value)}
              className={locale === value ? "text-primary font-semibold" : ""}
            >
              {LOCALE_LABELS[value]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        onClick={() => void handleThemeToggle()}
        className={cn(
          "inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface p-1.5 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors",
          compact && "p-1.5"
        )}
        aria-label={t("preferences.toggleTheme")}
      >
        <span className="material-symbols-outlined text-[16px]">
          {theme === "light" ? "dark_mode" : "light_mode"}
        </span>
      </button>
    </div>
  );
}
