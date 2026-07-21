import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO_FULL = "/images/logo-nav.png";
const LOGO_ICON = "/images/logo-icon.png";

const LOGO_FULL_WIDTH = 390;
const LOGO_FULL_HEIGHT = 150;

interface BrandLogoProps {
  variant?: "full" | "icon";
  href?: string | null;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function BrandLogo({
  variant = "full",
  href = "/",
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  const isFull = variant === "full";

  const content = (
    <Image
      src={isFull ? LOGO_FULL : LOGO_ICON}
      alt="Objectif TCF"
      width={isFull ? LOGO_FULL_WIDTH : 40}
      height={isFull ? LOGO_FULL_HEIGHT : 40}
      priority={priority}
      className={cn(
        "w-auto object-contain",
        isFull ? "h-12 sm:h-14 md:h-16 w-auto max-w-[min(100%,220px)] sm:max-w-[260px] md:max-w-[280px]" : "h-9 w-9 sm:h-10 sm:w-10",
        imageClassName
      )}
    />
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
