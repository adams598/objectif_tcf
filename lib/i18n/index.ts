import type { AppLocale, Messages } from "./types";
import { frFR as frFRCore } from "./messages/fr-FR";
import { frCA as frCACore } from "./messages/fr-CA";
import { enCA as enCACore } from "./messages/en-CA";
import { appExtFr } from "./messages/app-ext-fr";
import { appExtEn } from "./messages/app-ext-en";

const catalogs: Record<AppLocale, Messages> = {
  "fr-FR": { ...frFRCore, ...appExtFr } as Messages,
  "fr-CA": { ...frCACore, ...appExtFr } as Messages,
  "en-CA": { ...enCACore, ...appExtEn } as Messages,
};
export function getMessages(locale: AppLocale): Messages {
  return catalogs[locale] ?? catalogs["fr-FR"];
}
export type TranslationKey = string;

export function translate(
  locale: AppLocale,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const messages = getMessages(locale);
  const parts = key.split(".");
  let value: unknown = messages;

  for (const part of parts) {
    if (value && typeof value === "object" && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  if (typeof value !== "string") return key;

  if (!params) return value;

  return Object.entries(params).reduce(
    (text, [paramKey, paramValue]) =>
      text.replaceAll(`{{${paramKey}}}`, String(paramValue)),
    value
  );
}

export { frFRCore as frFR, frCACore as frCA, enCACore as enCA };