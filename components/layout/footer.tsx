import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-xl px-lg flex flex-col md:flex-row justify-between items-center gap-lg bg-surface-container-lowest border-t border-outline-variant">
      {/* Brand */}
      <div className="font-headline-lg text-[22px] text-primary font-bold">
        Objectif Canada
      </div>

      {/* Links */}
      <div className="flex flex-wrap justify-center gap-md md:gap-lg">
        <Link
          href="/confidentialite"
          className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
        >
          Politique de confidentialité
        </Link>
        <Link
          href="/conditions"
          className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
        >
          Conditions d&apos;utilisation
        </Link>
        <Link
          href="/contact"
          className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
        >
          Contact
        </Link>
        <Link
          href="/blog"
          className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary hover:underline opacity-80 hover:opacity-100 transition-opacity"
        >
          Blog
        </Link>
      </div>

      {/* Copyright */}
      <div className="font-body-md text-body-md text-on-surface-variant text-sm">
        © {new Date().getFullYear()} Objectif Canada TCF. Tous droits réservés.
      </div>
    </footer>
  );
}
