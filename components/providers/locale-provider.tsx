"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeToHtmlLang,
  parseAppLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { translate, type TranslationKey } from "@/lib/i18n";

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readCookieLocale(): AppLocale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return DEFAULT_LOCALE;
  return parseAppLocale(decodeURIComponent(match.split("=")[1]));
}

function writeCookieLocale(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000;SameSite=Lax`;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readCookieLocale());
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    writeCookieLocale(next);
    document.documentElement.lang = localeToHtmlLang(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = localeToHtmlLang(locale);
  }, [locale]);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}

export function useTranslation() {
  const { t, locale, setLocale } = useLocale();
  return { t, locale, setLocale };
}
