import Link from "next/link";
import type { Metadata } from "next";
import { BrandLogo } from "@/components/layout/brand-logo";

export const metadata: Metadata = {
  title: {
    template: "%s | Objectif TCF",
    default: "Authentification | Objectif TCF",
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Minimal header */}
      <header className="flex justify-between items-center px-lg h-16 border-b border-outline-variant bg-surface/80 backdrop-blur-md">
        <BrandLogo variant="full" href="/" imageClassName="h-12 max-w-[220px]" />
        <Link
          href="/"
          className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-xs"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour
        </Link>
      </header>

      {/* Auth content */}
      <main className="flex-1 flex items-center justify-center p-md md:p-xl relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">
          {children}
        </div>
      </main>
    </div>
  );
}
