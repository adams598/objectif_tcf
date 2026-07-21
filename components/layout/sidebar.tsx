"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/use-current-user";
import { BrandLogo } from "@/components/layout/brand-logo";
import { PreferenceToggles } from "@/components/layout/preference-toggles";
import { useTranslation } from "@/components/providers/locale-provider";

async function logout() {
  await fetch("/api/auth/deconnexion", { method: "POST" });
  window.location.href = "/connexion";
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
  badge?: number;
}

const studentNavItems: NavItem[] = [
  { href: "/tableau-de-bord", labelKey: "nav.dashboard", icon: "dashboard" },
  { href: "/series", labelKey: "nav.series", icon: "library_books" },
  { href: "/resultats", labelKey: "nav.results", icon: "analytics" },
  { href: "/communaute", labelKey: "nav.community", icon: "forum" },
  { href: "/messagerie", labelKey: "nav.messaging", icon: "chat" },
  { href: "/parametres", labelKey: "nav.settings", icon: "settings" },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", labelKey: "nav.adminOverview", icon: "dashboard" },
  { href: "/admin/offres", labelKey: "nav.adminOffers", icon: "payments" },
  { href: "/admin/paiements", labelKey: "nav.adminPayments", icon: "receipt_long" },
  { href: "/admin/utilisateurs", labelKey: "nav.adminUsers", icon: "group" },
  { href: "/admin/examens", labelKey: "nav.adminExams", icon: "school" },
  { href: "/admin/series", labelKey: "nav.adminSeries", icon: "library_books" },
  { href: "/admin/communaute", labelKey: "nav.adminCommunity", icon: "forum" },
  { href: "/admin/correcteurs", labelKey: "nav.adminCorrectors", icon: "edit_note" },
];

interface SidebarProps {
  role?: "USER" | "ADMIN" | "SUPER_ADMIN" | "CORRECTOR";
}

const correctorNavItems: NavItem[] = [
  { href: "/correcteur", labelKey: "nav.correctorSpace", icon: "edit_note" },
  { href: "/messagerie", labelKey: "nav.messaging", icon: "chat" },
  { href: "/parametres", labelKey: "nav.settings", icon: "settings" },
];

export function Sidebar({ role = "USER" }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { displayName, email, avatarUrl, isLoading } = useCurrentUser();
  const { t } = useTranslation();

  const navItems =
    role === "ADMIN" || role === "SUPER_ADMIN"
      ? adminNavItems
      : role === "CORRECTOR"
        ? correctorNavItems
        : studentNavItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-outline-variant z-40 overflow-hidden"
    >
      <div className="flex items-center gap-sm px-md h-16 border-b border-outline-variant shrink-0">
        <BrandLogo
          variant={collapsed ? "icon" : "full"}
          href="/"
          className="min-w-0 flex-1"
          imageClassName={collapsed ? undefined : "h-11 max-w-[200px]"}
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      <nav className="flex-1 py-md overflow-y-auto">
        <ul className="flex flex-col gap-xs px-sm">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/tableau-de-bord" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-md px-md py-sm rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-primary rounded-r-full" />
                  )}
                  <span
                    className={cn(
                      "material-symbols-outlined text-[22px] shrink-0",
                      isActive ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
                    )}
                  >
                    {item.icon}
                  </span>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "font-label-md text-label-md whitespace-nowrap",
                          isActive ? "font-semibold text-primary" : ""
                        )}
                      >
                        {t(item.labelKey)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {item.badge && !collapsed && (
                    <span className="ml-auto bg-primary text-on-primary text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {!collapsed && role === "USER" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-sm mt-md"
          >
            <Link
              href="/examen"
              className="flex items-center gap-md px-md py-sm rounded-xl bg-gradient-primary text-on-primary group hover:shadow-violet-md transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">
                play_circle
              </span>
              <span className="font-label-md text-label-md font-semibold">
                {t("nav.examMode")}
              </span>
            </Link>
          </motion.div>
        )}
      </nav>

      <div className="border-t border-outline-variant p-sm">
        {!collapsed ? (
          <div className="px-md pb-sm">
            <PreferenceToggles />
          </div>
        ) : (
          <div className="flex justify-center pb-sm">
            <PreferenceToggles compact />
          </div>
        )}
        <Link
          href="/aide"
          className="flex items-center gap-md px-md py-sm rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all group mb-xs"
        >
          <span className="material-symbols-outlined text-[22px] shrink-0">help_outline</span>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-label-md text-label-md whitespace-nowrap"
              >
                {t("nav.help")}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-sm px-md py-sm rounded-xl hover:bg-surface-container transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("nav.accountMenu")}
            >
              <Avatar
                src={avatarUrl}
                name={displayName || email || t("common.user")}
                size="sm"
                className="shrink-0"
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-label-md text-label-md text-on-surface font-semibold truncate">
                      {isLoading
                        ? t("common.loading")
                        : displayName || email || t("common.myProfile")}
                    </p>
                    {!isLoading && email && displayName && (
                      <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                        {email}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {!collapsed && (
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0">
                  expand_more
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side={collapsed ? "right" : "top"}
            align="start"
            className="w-52"
          >
            <DropdownMenuItem asChild>
              <Link href="/parametres" className="cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">settings</span>
                {t("nav.settings")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-error focus:text-error"
              onSelect={() => void logout()}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              {t("nav.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
