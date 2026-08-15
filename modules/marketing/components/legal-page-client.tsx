"use client";

import { useTranslation } from "@/components/providers/locale-provider";
import {
  getPrivacyContent,
  getRefundContent,
  getTermsContent,
} from "@/lib/marketing/content/legal";
import { LegalPageView } from "@/modules/marketing/components/legal-page";

type LegalKind = "terms" | "privacy" | "refund";

function getLegalContent(kind: LegalKind, locale: string) {
  if (kind === "terms") return getTermsContent(locale);
  if (kind === "privacy") return getPrivacyContent(locale);
  return getRefundContent(locale);
}

export function LegalPageClient({
  kind,
  downloadHref,
}: {
  kind: LegalKind;
  downloadHref?: string;
}) {
  const { locale, t } = useTranslation();
  const content = getLegalContent(kind, locale);

  return (
    <LegalPageView
      content={content}
      downloadHref={downloadHref}
      downloadLabel={t("marketingPages.downloadPdf")}
    />
  );
}
