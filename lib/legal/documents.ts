import type { LegalContent } from "@/lib/marketing/content/legal";
import { privacyFr, refundFr, termsFr } from "@/lib/marketing/content/legal";
import { getPrestationCgv } from "@/lib/legal/prestation-cgv";
import { getPrestataireConfig } from "@/lib/legal/prestation-config";
import type { InvoiceCompanyConfig } from "@/lib/invoices/company-config";
import { getInvoiceCompanyConfig } from "@/lib/invoices/company-config";

export type LegalDocumentSlug =
  | "prestation-cgv"
  | "cgu"
  | "confidentialite"
  | "remboursement";

export type LegalDocumentGroup = "prestation" | "site";

export interface LegalDocumentMeta {
  slug: LegalDocumentSlug;
  title: string;
  description: string;
  filename: string;
  href: string | null;
  group: LegalDocumentGroup;
  public: boolean;
}

export const LEGAL_DOCUMENTS: LegalDocumentMeta[] = [
  {
    slug: "prestation-cgv",
    title: "CGV de la prestation",
    description:
      "Contrat Prestataire / Client : développement du site Objectif TCF, périmètre, prix, garantie, propriété intellectuelle.",
    filename: "CGV-prestation-Objectif-TCF.pdf",
    href: null,
    group: "prestation",
    public: false,
  },
  {
    slug: "cgu",
    title: "CGU du site (utilisateurs)",
    description:
      "Conditions d'utilisation destinées aux candidats et abonnés de la plateforme.",
    filename: "Objectif-TCF-CGU-utilisateurs.pdf",
    href: "/conditions",
    group: "site",
    public: true,
  },
  {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    description: "Collecte, usage et protection des données des utilisateurs du site.",
    filename: "Objectif-TCF-politique-confidentialite.pdf",
    href: "/confidentialite",
    group: "site",
    public: true,
  },
  {
    slug: "remboursement",
    title: "Conditions de remboursement",
    description: "Règles de rétractation vis-à-vis des abonnés du site.",
    filename: "Objectif-TCF-remboursement.pdf",
    href: "/remboursement",
    group: "site",
    public: true,
  },
];

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return LEGAL_DOCUMENTS.some((d) => d.slug === value);
}

export function isPublicLegalSlug(value: string): value is LegalDocumentSlug {
  return LEGAL_DOCUMENTS.some((d) => d.slug === value && d.public);
}

export function getLegalDocument(slug: LegalDocumentSlug): {
  meta: LegalDocumentMeta;
  content: LegalContent;
  issuer: InvoiceCompanyConfig;
} {
  const meta = LEGAL_DOCUMENTS.find((d) => d.slug === slug)!;
  const content =
    slug === "prestation-cgv"
      ? getPrestationCgv()
      : slug === "cgu"
        ? termsFr
        : slug === "confidentialite"
          ? privacyFr
          : refundFr;

  if (slug === "prestation-cgv") {
    const p = getPrestataireConfig();
    return {
      meta,
      content,
      issuer: {
        legalName: p.legalName,
        tradeName: p.tradeName,
        addressLines: p.addressLines,
        email: p.email || "—",
        website: "",
        siret: p.siret,
        vatNumber: null,
        rcs: null,
        capital: null,
      },
    };
  }

  return { meta, content, issuer: getInvoiceCompanyConfig() };
}
