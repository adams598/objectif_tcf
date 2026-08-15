"use client";

import React from "react";
import Link from "next/link";
import type { LegalContent, LegalListItem, LegalSection } from "@/lib/marketing/content/legal";
import { useTranslation } from "@/components/providers/locale-provider";
import {
  MarketingPageHero,
  MarketingPageShell,
} from "@/components/marketing/marketing-page";

interface LegalPageProps {
  content: LegalContent;
  downloadHref?: string;
  downloadLabel?: string;
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

function renderRichText(text: string, keyPrefix: string) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;

  const pattern = new RegExp(LINK_PATTERN.source, "g");

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [, label, href] = match;
    const isExternal =
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:");

    parts.push(
      isExternal ? (
        <a
          key={`${keyPrefix}-link-${linkIndex}`}
          href={href}
          className="text-primary underline hover:opacity-80"
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        >
          {label}
        </a>
      ) : (
        <Link
          key={`${keyPrefix}-link-${linkIndex}`}
          href={href}
          className="text-primary underline hover:opacity-80"
        >
          {label}
        </Link>
      )
    );

    linkIndex += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function LegalList({ items, keyPrefix }: { items: LegalListItem[]; keyPrefix: string }) {
  return (
    <ul className="list-disc list-inside space-y-xs font-body-md text-body-md text-on-surface-variant ml-sm">
      {items.map((item, index) => (
        <li key={`${keyPrefix}-${index}`} className="leading-relaxed">
          {renderRichText(item.text, `${keyPrefix}-${index}`)}
          {item.children && item.children.length > 0 && (
            <ul className="list-[circle] list-inside mt-xs ml-md space-y-xs">
              {item.children.map((child, childIndex) => (
                <li key={`${keyPrefix}-${index}-${childIndex}`}>
                  {renderRichText(child.text, `${keyPrefix}-${index}-${childIndex}`)}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function LegalSectionBlock({
  section,
  level = 2,
  index,
}: {
  section: LegalSection;
  level?: 2 | 3 | 4;
  index: number;
}) {
  const HeadingTag = level === 2 ? "h2" : level === 3 ? "h3" : "h4";
  const headingClass =
    level === 2
      ? "font-headline-lg text-[18px] text-on-surface font-bold mb-md"
      : level === 3
        ? "font-headline-md text-[16px] text-on-surface font-semibold mb-sm mt-lg"
        : "font-label-md text-label-md text-on-surface font-semibold mb-sm mt-md";

  const keyPrefix = `section-${index}-${level}`;

  return (
    <section>
      <HeadingTag className={headingClass}>{section.title}</HeadingTag>

      {section.paragraphs?.map((paragraph, paragraphIndex) => (
        <p
          key={`${keyPrefix}-p-${paragraphIndex}`}
          className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-sm text-justify"
        >
          {renderRichText(paragraph, `${keyPrefix}-p-${paragraphIndex}`)}
        </p>
      ))}

      {section.list && (
        <div className="mb-sm">
          <LegalList items={section.list} keyPrefix={`${keyPrefix}-list`} />
        </div>
      )}

      {section.paragraphsAfterList?.map((paragraph, paragraphIndex) => (
        <p
          key={`${keyPrefix}-pal-${paragraphIndex}`}
          className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-sm text-justify"
        >
          {renderRichText(paragraph, `${keyPrefix}-pal-${paragraphIndex}`)}
        </p>
      ))}

      {section.listAfterParagraphs && (
        <div className="mb-sm">
          <LegalList
            items={section.listAfterParagraphs}
            keyPrefix={`${keyPrefix}-list-after`}
          />
        </div>
      )}

      {section.subsections?.map((subsection, subsectionIndex) => (
        <LegalSectionBlock
          key={`${keyPrefix}-sub-${subsectionIndex}`}
          section={subsection}
          level={level === 2 ? 3 : 4}
          index={subsectionIndex}
        />
      ))}
    </section>
  );
}

export function LegalPageView({
  content,
  downloadHref,
  downloadLabel,
}: LegalPageProps) {
  const { t } = useTranslation();

  return (
    <MarketingPageShell narrow>
      <MarketingPageHero title={content.title} subtitle={content.lastUpdated} />

      {downloadHref ? (
        <div className="mb-xl">
          <a
            href={downloadHref}
            className="inline-flex items-center gap-sm rounded-xl border border-outline-variant bg-surface px-md py-sm font-label-md text-label-md text-on-surface hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            {downloadLabel ?? t("marketingPages.downloadPdf")}
          </a>
        </div>
      ) : null}

      <div className="space-y-xl">
        {content.sections.map((section, index) => (
          <LegalSectionBlock key={section.title} section={section} index={index} />
        ))}
      </div>
    </MarketingPageShell>
  );
}
