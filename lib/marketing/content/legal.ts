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
import { termsFr } from "@/lib/marketing/content/terms-fr";

export { privacyFr, refundFr, termsFr };

export function getPrivacyContent(_locale: string): LegalContent {
  return privacyFr;
}

export function getRefundContent(_locale: string): LegalContent {
  return refundFr;
}

export function getTermsContent(_locale: string): LegalContent {
  return termsFr;
}
