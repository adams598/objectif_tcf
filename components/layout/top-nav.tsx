"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PreferenceToggles } from "@/components/layout/preference-toggles";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { useTranslation } from "@/components/providers/locale-provider";
import {
  getDashboardHref,
  useAuthSession,
} from "@/lib/hooks/use-auth-session";

async function logout() {
  await fetch("/api/auth/deconnexion", { method: "POST" });
  window.location.href = "/";
}

export function TopNav() {
  const { t } = useTranslation();
  const { data: session, isLoading: isSessionLoading } = useAuthSession();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const aboutTcfItems = [
    {
      href: "/a-propos-tcf",
      label: t("marketingNav.aboutOverview"),
      description: t("marketingNav.aboutOverviewDesc"),
    },
    {
      href: "/a-propos-tcf#epreuves",
      label: t("marketingNav.aboutTests"),
      description: t("marketingNav.aboutTestsDesc"),
    },
    {
      href: "/a-propos-tcf#inscription",
      label: t("marketingNav.aboutRegistration"),
      description: t("marketingNav.aboutRegistrationDesc"),
    },
    {
      href: "/a-propos-tcf#resultats",
      label: t("marketingNav.aboutResults"),
      description: t("marketingNav.aboutResultsDesc"),
    },
    {
      href: "/a-propos-tcf#liens-utiles",
      label: t("marketingNav.aboutLinks"),
      description: t("marketingNav.aboutLinksDesc"),
    },
  ];

  const newsItems = [
    {
      href: "/sujets-actualite",
      label: t("marketingNav.newsTopics"),
      description: t("marketingNav.newsTopicsDesc"),
    },
    {
      href: "/preparation/tcf",
      label: "TCF Canada",
      description: t("marketingNav.prepTcfDesc"),
    },
    {
      href: "/preparation/tef",
      label: "TEF Canada",
      description: t("marketingNav.prepTefDesc"),
    },
    {
      href: "/preparation/ielts",
      label: "IELTS",
      description: t("marketingNav.prepIeltsDesc"),
    },
  ];

  const pagesItems = [
    {
      href: "/faq",
      label: t("marketingNav.faq"),
      description: t("marketingNav.faqDesc"),
    },
    {
      href: "/confidentialite",
      label: t("layout.privacy"),
      description: t("marketingNav.privacyDesc"),
    },
    {
      href: "/remboursement",
      label: t("marketingNav.refund"),
      description: t("marketingNav.refundDesc"),
    },
  ];

  const simpleLinks = [
    { href: "/", label: t("marketingNav.home") },
    { href: "/contact", label: t("marketingNav.contact") },
    { href: "/offres", label: t("layout.pricing") },
  ];

  const mobileSections = [
    { title: t("marketingNav.home"), links: [{ href: "/", label: t("marketingNav.home") }] },
    { title: t("marketingNav.news"), links: newsItems },
    { title: t("marketingNav.aboutTcf"), links: aboutTcfItems },
    { title: t("marketingNav.pages"), links: pagesItems },
    { title: t("marketingNav.contact"), links: [{ href: "/contact", label: t("marketingNav.contact") }] },
    { title: t("layout.pricing"), links: [{ href: "/offres", label: t("layout.pricing") }] },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 w-full z-50">
        <div className="bg-primary text-on-primary text-center font-label-sm text-label-sm py-xs px-md">
          {t("marketingNav.banner")}
        </div>
        <nav
          className={cn(
            "flex justify-between items-center px-lg h-20 border-b border-outline-variant transition-all duration-300",
            scrolled
              ? "bg-surface/95 backdrop-blur-md shadow-md"
              : "bg-surface/80 backdrop-blur-md shadow-sm"
          )}
        >
          <BrandLogo variant="full" priority imageClassName="h-14 md:h-16 max-w-[280px]" />

          <div className="hidden lg:flex items-center gap-md">
            {simpleLinks.slice(0, 2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-label-md text-label-md transition-colors px-sm py-xs rounded-lg",
                  isActive(link.href)
                    ? "text-primary font-bold"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}

            <NavDropdown
              label={t("marketingNav.news")}
              items={newsItems}
              isActive={
                isActive("/sujets-actualite") ||
                isActive("/preparation")
              }
            />

            <NavDropdown
              label={t("marketingNav.aboutTcf")}
              items={aboutTcfItems}
              isActive={isActive("/a-propos-tcf")}
            />

            <NavDropdown
              label={t("marketingNav.pages")}
              items={pagesItems}
              isActive={
                isActive("/faq") ||
                isActive("/confidentialite") ||
                isActive("/remboursement")
              }
            />

            {simpleLinks.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "font-label-md text-label-md transition-colors px-sm py-xs rounded-lg",
                  isActive(link.href)
                    ? "text-primary font-bold"
                    : "text-on-surface-variant hover:text-primary"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-md shrink-0">
            <PreferenceToggles />
            {isSessionLoading ? (
              <div className="h-10 w-32 animate-pulse rounded-xl bg-surface-container" />
            ) : session ? (
              <>
                <span className="font-label-md text-label-md text-on-surface-variant hidden xl:inline">
                  {session.displayFirstName || session.name}
                </span>
                <Button asChild size="default">
                  <Link href={getDashboardHref(session.role)}>
                    {t("nav.dashboard")}
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/connexion"
                  className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
                >
                  {t("layout.login")}
                </Link>
                <Button asChild size="default">
                  <Link href="/inscription">{t("layout.getStarted")}</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="lg:hidden text-on-surface p-sm rounded-lg hover:bg-surface-container transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={t("layout.menu")}
          >
            <span className="material-symbols-outlined">
              {mobileOpen ? "close" : "menu"}
            </span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[calc(2rem+5rem)] left-0 right-0 z-40 bg-surface border-b border-outline-variant shadow-violet-md lg:hidden max-h-[70vh] overflow-y-auto"
          >
            <div className="p-md space-y-md">
              {mobileSections.map((section) => (
                <div key={section.title}>
                  <p className="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wide px-md mb-xs">
                    {section.title}
                  </p>
                  <ul className="space-y-xs">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "block px-md py-sm rounded-xl font-label-md text-label-md transition-colors",
                            isActive(link.href)
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-on-surface hover:bg-surface-container"
                          )}
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="pt-sm border-t border-outline-variant space-y-sm">
              <PreferenceToggles className="px-md" />
              <div className="space-y-sm">
                {session ? (
                  <>
                    <p className="px-md font-label-sm text-label-sm text-on-surface-variant">
                      {session.displayFirstName || session.name}
                    </p>
                    <Button asChild className="w-full">
                      <Link
                        href={getDashboardHref(session.role)}
                        onClick={() => setMobileOpen(false)}
                      >
                        {t("nav.dashboard")}
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => {
                        setMobileOpen(false);
                        void logout();
                      }}
                    >
                      {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/connexion"
                      className="block px-md py-sm text-on-surface-variant font-label-md"
                      onClick={() => setMobileOpen(false)}
                    >
                      {t("layout.login")}
                    </Link>
                    <Button asChild className="w-full">
                      <Link href="/inscription" onClick={() => setMobileOpen(false)}>
                        {t("layout.getStartedFree")}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
