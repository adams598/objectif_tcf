"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

const studentNavItems: NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", icon: "dashboard" },
  { href: "/series", label: "Mes séries", icon: "library_books" },
  { href: "/resultats", label: "Résultats", icon: "analytics" },
  { href: "/communaute", label: "Communauté", icon: "forum" },
  { href: "/messagerie", label: "Messagerie", icon: "chat" },
  { href: "/parametres", label: "Paramètres", icon: "settings" },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: "dashboard" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "group" },
  { href: "/admin/series", label: "Séries", icon: "library_books" },
  { href: "/admin/correcteurs", label: "Correcteurs", icon: "edit_note" },
];

interface SidebarProps {
  role?: "USER" | "ADMIN" | "SUPER_ADMIN" | "CORRECTOR";
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
    nclcLevel?: string;
  };
}

export function Sidebar({ role = "USER", user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === "ADMIN" || role === "SUPER_ADMIN" ? adminNavItems : studentNavItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-outline-variant z-40 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-sm px-lg h-20 border-b border-outline-variant shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
          <span className="text-on-primary text-sm font-bold">OC</span>
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="font-display-md text-[18px] font-bold text-primary whitespace-nowrap"
            >
              Objectif Canada
            </motion.span>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          aria-label={collapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>
      </div>

      {/* Navigation */}
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
                        {item.label}
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

        {/* Exam CTA */}
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
                Mode Examen
              </span>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-outline-variant p-sm">
        {/* Help */}
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
                Aide
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-sm px-md py-sm rounded-xl hover:bg-surface-container transition-colors cursor-pointer">
            <Avatar
              src={user.avatarUrl}
              name={user.name}
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
                    {user.name}
                  </p>
                  {user.nclcLevel && (
                    <p className="font-label-sm text-label-sm text-primary">
                      NCLC {user.nclcLevel}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
