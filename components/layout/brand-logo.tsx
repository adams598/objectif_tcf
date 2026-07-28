"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const LOGO_FULL = "/images/logo-nav.png";
const LOGO_ICON = "/images/logo-icon.png";

const LOGO_FULL_WIDTH = 390;
const LOGO_FULL_HEIGHT = 150;

interface BrandLogoProps {
  variant?: "full" | "icon";
  /** Sidebar : compact, sans ombre lourde */
  appearance?: "default" | "sidebar";
  href?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

function LogoFallback({ variant }: { variant: "full" | "icon" }) {
  if (variant === "icon") {
    return (
      <span
        className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary text-on-primary font-bold text-sm"
        aria-hidden
      >
        TCF
      </span>
    );
  }

  return (
    <span className="font-display-md text-display-md font-bold text-primary whitespace-nowrap">
      Objectif TCF
    </span>
  );
}

export function BrandLogo({
  variant = "full",
  appearance = "default",
  href = "/",
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);
  const isFull = variant === "full";
  const isSidebar = appearance === "sidebar";

  const content = imgError ? (
    <LogoFallback variant={variant} />
  ) : (
    <span
      className={cn(
        "inline-flex items-center",
        isFull &&
          (isSidebar
            ? "rounded-md bg-white/90 px-1 py-0.5 ring-1 ring-outline-variant/25"
            : "rounded-lg bg-white px-2 py-1 shadow-sm")
      )}
    >
      <Image
        src={isFull ? LOGO_FULL : LOGO_ICON}
        alt="Objectif TCF"
        width={isFull ? LOGO_FULL_WIDTH : 40}
        height={isFull ? LOGO_FULL_HEIGHT : 40}
        priority={priority}
        unoptimized
        onError={() => setImgError(true)}
        className={cn(
          "w-auto object-contain object-left",
          isFull
            ? isSidebar
              ? "h-7 max-w-[132px]"
              : "h-12 sm:h-14 md:h-16 w-auto max-w-[min(100%,220px)] sm:max-w-[260px] md:max-w-[280px]"
            : isSidebar
              ? "h-7 w-7"
              : "h-9 w-9 sm:h-10 sm:w-10",
          imageClassName
        )}
      />
    </span>
  );

  if (href == null || href === "") {
    return <div className={cn("inline-flex items-center", className)}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn("inline-flex items-center shrink-0 group", className)}
      aria-label="Objectif TCF — Accueil"
    >
      {content}
    </Link>
  );
}
