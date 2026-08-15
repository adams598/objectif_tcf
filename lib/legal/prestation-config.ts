import { getInvoiceCompanyConfig } from "@/lib/invoices/company-config";

export interface PrestataireConfig {
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  addressLines: string[];
  siret: string | null;
  apeCode: string;
  amountCad: string;
  durationWeeks: number;
  paymentMethod: string;
}

export function getPrestataireConfig(): PrestataireConfig {
  const address = process.env.PRESTATAIRE_ADDRESS?.trim();
  return {
    legalName:
      process.env.PRESTATAIRE_LEGAL_NAME?.trim() ||
      "Le Prestataire, micro-entrepreneur",
    tradeName:
      process.env.PRESTATAIRE_TRADE_NAME?.trim() ||
      process.env.PRESTATAIRE_LEGAL_NAME?.trim() ||
      "Le Prestataire",
    email: process.env.PRESTATAIRE_EMAIL?.trim() || "",
    phone: process.env.PRESTATAIRE_PHONE?.trim() || "",
    addressLines: address
      ? address
          .split(/\r?\n|\\n/)
          .map((l) => l.trim())
          .filter(Boolean)
      : ["France"],
    siret: process.env.PRESTATAIRE_SIRET?.trim() || null,
    apeCode: process.env.PRESTATAIRE_APE?.trim() || "62.01Z",
    amountCad: process.env.PRESTATION_AMOUNT_CAD?.trim() || "1 000,00",
    durationWeeks: Number(process.env.PRESTATION_DURATION_WEEKS?.trim() || "6") || 6,
    paymentMethod:
      process.env.PRESTATION_PAYMENT_METHOD?.trim() || "virement bancaire",
  };
}

export function getClientConfig() {
  const company = getInvoiceCompanyConfig();
  return {
    legalName: company.legalName,
    tradeName: company.tradeName,
    email: company.email,
    website: company.website.replace(/\/$/, ""),
  };
}
