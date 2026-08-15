"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/locale-provider";

export function AidePageContent() {
  const { t } = useTranslation();

  const faqs = [
    { q: t("help.qAccess"), a: t("help.aAccess") },
    { q: t("help.qCancel"), a: t("help.aCancel") },
    { q: t("help.qInvoices"), a: t("help.aInvoices") },
    { q: t("help.qHuman"), a: t("help.aHuman") },
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-xl">
      <div>
        <h1 className="font-display-md text-display-md font-bold text-on-surface mb-xs">
          {t("help.title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {t("help.subtitle")}
        </p>
      </div>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[18px] font-bold mb-md">
          {t("help.faqTitle")}
        </h2>
        <div className="space-y-md">
          {faqs.map((item) => (
            <div key={item.q} className="border-b border-outline-variant/50 pb-md last:border-0">
              <p className="font-label-md text-label-md font-semibold text-on-surface mb-xs">
                {item.q}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-outline-variant rounded-2xl p-lg">
        <h2 className="font-headline-lg text-[18px] font-bold mb-md">
          {t("help.linksTitle")}
        </h2>
        <ul className="space-y-sm font-body-md text-body-md">
          <li>
            <Link href="/tarifs" className="text-primary hover:underline">
              {t("help.linkOffers")}
            </Link>
          </li>
          <li>
            <Link href="/confidentialite" className="text-primary hover:underline">
              {t("help.linkPrivacy")}
            </Link>
          </li>
          <li>
            <Link href="/remboursement" className="text-primary hover:underline">
              {t("help.linkRefund")}
            </Link>
          </li>
          <li>
            <Link href="/contact" className="text-primary hover:underline">
              {t("help.linkContact")}
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
