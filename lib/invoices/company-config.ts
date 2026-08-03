export interface InvoiceCompanyConfig {
  legalName: string;
  tradeName: string;
  addressLines: string[];
  email: string;
  website: string;
  siret: string | null;
  vatNumber: string | null;
  rcs: string | null;
  capital: string | null;
}

export function getInvoiceCompanyConfig(): InvoiceCompanyConfig {
  return {
    legalName:
      process.env.INVOICE_COMPANY_LEGAL_NAME?.trim() ||
      "Objectif Canada TCF",
    tradeName:
      process.env.INVOICE_COMPANY_TRADE_NAME?.trim() || "Objectif TCF",
    addressLines: (
      process.env.INVOICE_COMPANY_ADDRESS ||
      "Plateforme e-learning\nService numérique de préparation aux examens"
    )
      .split(/\r?\n|\\n/)
      .map((l) => l.trim())
      .filter(Boolean),
    email:
      process.env.INVOICE_COMPANY_EMAIL?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      "contact@objectifcanada-tcf.com",
    website:
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      "https://objectifcanada-tcf.com",
    siret: process.env.INVOICE_SIRET?.trim() || null,
    vatNumber: process.env.INVOICE_VAT_NUMBER?.trim() || null,
    rcs: process.env.INVOICE_RCS?.trim() || null,
    capital: process.env.INVOICE_CAPITAL?.trim() || null,
  };
}

/** Mention TVA — prestation numérique (art. 259 B CGI pour clients UE B2C). */
export function getVatMention(currency: string): {
  rateLabel: string;
  vatAmount: number;
  netAmount: number;
} {
  // Montants TTC enregistrés — TVA non applicable hors UE / micro simplifié par défaut
  return {
    rateLabel: "TVA non applicable — art. 259-1 du CGI (prestation de services numériques)",
    vatAmount: 0,
    netAmount: 0,
  };
}
