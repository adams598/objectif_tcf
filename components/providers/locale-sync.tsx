"use client";

import { useEffect } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { parseAppLocale } from "@/lib/i18n/locales";

/** Synchronise la langue affichée avec les paramètres utilisateur en BDD */
export function LocaleSync() {
  const { settings } = useUserPreferences();
  const { setLocale } = useLocale();

  useEffect(() => {
    if (settings?.language) {
      setLocale(parseAppLocale(settings.language));
    }
  }, [settings?.language, setLocale]);

  return null;
}
