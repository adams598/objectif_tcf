"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTranslation } from "@/components/providers/locale-provider";
import { UserInvoicesSection } from "@/modules/dashboard/components/user-invoices-section";
import { UserResultsDocumentsSection } from "@/modules/dashboard/components/user-results-documents-section";

export function DocumentsView() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-xl max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display-md text-display-md font-bold text-on-surface">
          {t("documents.title")}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-xs">
          {t("documents.subtitle")}
        </p>
      </motion.div>

      <UserResultsDocumentsSection />
      <UserInvoicesSection variant="documents" />

      <p className="font-body-sm text-body-sm text-on-surface-variant">
        {t("documents.settingsHint")}{" "}
        <Link href="/parametres" className="text-primary hover:underline">
          {t("nav.settings")}
        </Link>
      </p>
    </div>
  );
}
