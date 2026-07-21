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

import { privacyFr } from "@/lib/marketing/content/privacy-fr";
import { refundFr } from "@/lib/marketing/content/refund-fr";

export { privacyFr, refundFr };

export function getPrivacyContent(locale: string): LegalContent {
  return privacyFr;
}

export function getRefundContent(locale: string): LegalContent {
  return refundFr;
}
