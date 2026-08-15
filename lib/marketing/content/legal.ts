export interface LegalListItem {
  text: string;
  children?: LegalListItem[];
}

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  paragraphsAfterList?: string[];
  list?: LegalListItem[];
  listAfterParagraphs?: LegalListItem[];
  subsections?: LegalSection[];
}

export interface LegalContent {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

import { privacyEn } from "@/lib/marketing/content/privacy-en";
import { privacyFr } from "@/lib/marketing/content/privacy-fr";
import { refundEn } from "@/lib/marketing/content/refund-en";
import { refundFr } from "@/lib/marketing/content/refund-fr";
import { termsEn } from "@/lib/marketing/content/terms-en";
import { termsFr } from "@/lib/marketing/content/terms-fr";

export { privacyEn, privacyFr, refundEn, refundFr, termsEn, termsFr };

function isEnglishLocale(locale: string): boolean {
  return locale.startsWith("en");
}

export function getPrivacyContent(locale: string): LegalContent {
  return isEnglishLocale(locale) ? privacyEn : privacyFr;
}

export function getRefundContent(locale: string): LegalContent {
  return isEnglishLocale(locale) ? refundEn : refundFr;
}

export function getTermsContent(locale: string): LegalContent {
  return isEnglishLocale(locale) ? termsEn : termsFr;
}
