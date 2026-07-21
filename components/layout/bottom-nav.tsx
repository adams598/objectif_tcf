"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/locale-provider";

const bottomNavItems = [
  { href: "/tableau-de-bord", labelKey: "nav.home", icon: "home" },
  { href: "/series", labelKey: "nav.series", icon: "library_books" },
  { href: "/communaute", labelKey: "nav.forum", icon: "forum" },
  { href: "/profil", labelKey: "nav.profile", icon: "person" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-outline-variant safe-bottom">
      <div className="flex items-center justify-around px-md py-sm relative">
        {bottomNavItems.slice(0, 2).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <BottomNavItem
              key={item.href}
              item={{ ...item, label: t(item.labelKey) }}
              isActive={isActive}
            />
          );
        })}

        <div className="relative -top-6">
          <Link
            href="/examen"
            className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gradient-primary text-on-primary shadow-violet-lg hover:shadow-violet-xl transition-all active:scale-95"
            aria-label={t("nav.examMode")}
          >
            <span className="material-symbols-outlined text-[28px]">
              play_circle
            </span>
          </Link>
        </div>

        {bottomNavItems.slice(2).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <BottomNavItem
              key={item.href}
              item={{ ...item, label: t(item.labelKey) }}
              isActive={isActive}
            />
          );
        })}
      </div>
    </nav>
  );
}

function BottomNavItem({
  item,
  isActive,
}: {
  item: { href: string; label: string; icon: string };
  isActive: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-sm py-xs rounded-xl transition-all duration-200 min-w-[60px]",
        isActive ? "text-primary" : "text-on-surface-variant"
      )}
    >
      <div className="relative">
        <span
          className={cn(
            "material-symbols-outlined text-[24px] transition-all",
            isActive ? "font-bold" : ""
          )}
          style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
        >
          {item.icon}
        </span>
        {isActive && (
          <motion.div
            layoutId="bottom-nav-indicator"
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
          />
        )}
      </div>
      <span className={cn("font-label-sm text-[10px]", isActive ? "font-semibold" : "")}>
        {item.label}
      </span>
    </Link>
  );
}
