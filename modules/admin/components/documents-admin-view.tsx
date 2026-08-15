"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LEGAL_DOCUMENTS,
  type LegalDocumentSlug,
} from "@/lib/legal/documents";

const GROUPS: { id: "prestation" | "site"; title: string; intro: string }[] = [
  {
    id: "prestation",
    title: "Votre relation avec le prestataire",
    intro:
      "CGV du développement du site : engagements, périmètre livré, garantie et propriété intellectuelle.",
  },
  {
    id: "site",
    title: "Documents du site (utilisateurs)",
    intro:
      "Textes destinés aux candidats et abonnés d'Objectif TCF — distincts du contrat de prestation.",
  },
];

export function DocumentsAdminView() {
  const [activeSlug, setActiveSlug] = useState<LegalDocumentSlug>("prestation-cgv");
  const active = LEGAL_DOCUMENTS.find((d) => d.slug === activeSlug)!;
  const previewUrl = `/api/admin/documents/${active.slug}?inline=1`;
  const downloadUrl = `/api/admin/documents/${active.slug}`;

  return (
    <div className="flex flex-col gap-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display-md text-display-md text-on-surface font-bold mb-xs">
          Documents
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Consultez et téléchargez les CGV de la prestation web, ainsi que les
          textes juridiques du site.
        </p>
      </motion.div>

      {GROUPS.map((group) => {
        const docs = LEGAL_DOCUMENTS.filter((d) => d.group === group.id);
        return (
          <section key={group.id} className="flex flex-col gap-md">
            <div>
              <h2 className="font-headline-lg text-[16px] font-bold text-on-surface">
                {group.title}
              </h2>
              <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs">
                {group.intro}
              </p>
            </div>
            <div
              className={cn(
                "grid grid-cols-1 gap-md",
                docs.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"
              )}
            >
              {docs.map((doc) => {
                const selected = doc.slug === activeSlug;
                return (
                  <button
                    key={doc.slug}
                    type="button"
                    onClick={() => setActiveSlug(doc.slug)}
                    className={cn(
                      "text-left rounded-2xl border p-lg transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-outline-variant bg-surface hover:border-primary/40"
                    )}
                  >
                    <p className="font-headline-lg text-[15px] font-bold text-on-surface">
                      {doc.title}
                    </p>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-xs leading-relaxed">
                      {doc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-md justify-between p-lg border-b border-outline-variant">
          <div>
            <h2 className="font-headline-lg text-[16px] font-bold text-on-surface">
              {active.title}
            </h2>
            <p className="font-label-sm text-[12px] text-on-surface-variant mt-xs">
              {active.filename}
            </p>
          </div>
          <div className="flex flex-wrap gap-sm">
            {active.href ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={active.href} target="_blank">
                  <span className="material-symbols-outlined text-[18px]">
                    open_in_new
                  </span>
                  Voir sur le site
                </Link>
              </Button>
            ) : null}
            <Button variant="secondary" size="sm" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <span className="material-symbols-outlined text-[18px]">
                  visibility
                </span>
                Ouvrir le PDF
              </a>
            </Button>
            <Button size="sm" asChild>
              <a href={downloadUrl} download={active.filename}>
                <span className="material-symbols-outlined text-[18px]">
                  download
                </span>
                Télécharger le PDF
              </a>
            </Button>
          </div>
        </div>

        <iframe
          title={active.title}
          src={previewUrl}
          className="w-full h-[min(80vh,920px)] bg-surface-container-low"
        />
      </div>
    </div>
  );
}
