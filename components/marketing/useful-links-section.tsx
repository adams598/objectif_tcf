import React from "react";
import Link from "next/link";
import type { UsefulLinksBlock } from "@/lib/marketing/content/about-tcf";

const externalLinkClass =
  "text-primary underline underline-offset-2 hover:text-primary/80 transition-colors";

interface UsefulLinksSectionProps {
  block: UsefulLinksBlock;
}

export function UsefulLinksSection({ block }: UsefulLinksSectionProps) {
  return (
    <div className="space-y-md">
      <h3 className="font-headline-lg text-[18px] text-on-surface font-bold">
        {block.subtitle}
      </h3>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {block.introBeforeLink}
        <Link
          href={block.introLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className={externalLinkClass}
        >
          {block.introLink.label}
        </Link>
        {block.introAfterLink}
      </p>

      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        {block.tipsIntro}
      </p>

      <div>
        <p className="font-label-md text-label-md font-bold text-on-surface mb-sm">
          {block.beforeTitle}
        </p>
        <ol className="list-decimal list-inside space-y-sm font-body-md text-body-md text-on-surface-variant">
          {block.beforeItems.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {typeof item === "string" ? (
                item
              ) : (
                <>
                  {item.before}
                  <Link
                    href={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={externalLinkClass}
                  >
                    {item.link.label}
                  </Link>
                  {item.after}
                </>
              )}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="font-label-md text-label-md font-bold text-on-surface mb-sm">
          {block.duringTitle}
        </p>
        <ol className="list-decimal list-inside space-y-sm font-body-md text-body-md text-on-surface-variant">
          {block.duringItems.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
