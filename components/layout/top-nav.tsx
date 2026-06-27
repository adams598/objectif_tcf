"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/tcf", label: "TCF" },
  { href: "/tef", label: "TEF" },
  { href: "/ielts", label: "IELTS" },
  { href: "/professeurs", label: "Professeurs" },
];

export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 w-full z-50 flex justify-between items-center px-lg h-20 border-b border-outline-variant transition-all duration-300",
          scrolled
            ? "bg-surface/95 backdrop-blur-md shadow-md"
            : "bg-surface/80 backdrop-blur-md shadow-sm"
        )}
        id="global-nav"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-sm group">
          <span className="font-display-md text-display-md font-bold text-primary group-hover:opacity-80 transition-opacity">
            Objectif Canada
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-xl">
          <ul className="flex items-center gap-lg">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "font-label-md text-label-md transition-colors hover:text-primary",
                      isActive
                        ? "text-primary font-bold border-b-2 border-primary pb-1"
                        : "text-on-surface-variant"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-md">
          <Link
            href="/connexion"
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
          >
            Connexion
          </Link>
          <Button asChild size="default">
            <Link href="/inscription">Commencer</Link>
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-on-surface p-sm rounded-lg hover:bg-surface-container transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className="material-symbols-outlined">
            {mobileOpen ? "close" : "menu"}
          </span>
        </button>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 right-0 z-40 bg-surface border-b border-outline-variant shadow-violet-md md:hidden"
          >
            <ul className="flex flex-col p-md gap-xs">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "block px-md py-sm rounded-xl font-label-md text-label-md transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-on-surface hover:bg-surface-container"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
              <li className="pt-sm border-t border-outline-variant mt-xs">
                <Link
                  href="/connexion"
                  className="block px-md py-sm text-on-surface-variant font-label-md text-label-md"
                  onClick={() => setMobileOpen(false)}
                >
                  Connexion
                </Link>
              </li>
              <li>
                <Button asChild className="w-full" size="default">
                  <Link href="/inscription" onClick={() => setMobileOpen(false)}>
                    Commencer gratuitement
                  </Link>
                </Button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
