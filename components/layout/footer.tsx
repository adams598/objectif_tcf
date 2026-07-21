"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useTranslation } from "@/components/providers/locale-provider";

export function Footer() {
  const { t } = useTranslation();

  const navigationLinks = [
    { href: "/a-propos-tcf", label: t("marketingNav.aboutTcf") },
    { href: "/faq", label: t("marketingNav.faq") },
    { href: "/contact", label: t("marketingNav.contact") },
  ];

  const legalLinks = [
    { href: "/confidentialite", label: t("layout.privacy") },
    { href: "/remboursement", label: t("marketingNav.refund") },
    { href: "/conditions", label: t("layout.terms") },
  ];

  return (
    <footer className="w-full py-2xl px-lg bg-surface-container-lowest border-t border-outline-variant">
      <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-3 gap-xl mb-xl">
        <div>
          <BrandLogo variant="full" href="/" className="mb-sm" imageClassName="h-14 max-w-[240px]" />
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {t("marketingNav.footerTagline")}
          </p>
        </div>

        <div>
          <p className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wide mb-md">
            {t("marketingNav.footerNav")}
          </p>
          <ul className="space-y-sm">
            {navigationLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-label-sm text-label-sm font-bold text-on-surface-variant uppercase tracking-wide mb-md">
            {t("marketingNav.footerLegal")}
          </p>
          <ul className="space-y-sm">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-label-md text-label-md text-on-surface hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-container-max mx-auto pt-md border-t border-outline-variant text-center font-body-sm text-body-sm text-on-surface-variant">
        {t("layout.copyright", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
