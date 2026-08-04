import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { InvoiceData } from "@/lib/invoices/types";
import { getInvoiceCompanyConfig } from "@/lib/invoices/company-config";

/**
 * Helvetica (WinAnsi) ne supporte pas les accents / unicode.
 * Sans normalisation, drawText plante sur « août », « émission », etc.
 */
function toPdfText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E\n]/g, "?")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = toPdfText(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

type PdfWriter = {
  page: PDFPage;
  y: number;
  margin: number;
  font: PDFFont;
  fontBold: PDFFont;
  doc: PDFDocument;
  draw: (text: string, opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; x?: number }) => void;
  gap: (n?: number) => void;
  ensureSpace: (needed?: number) => void;
};

function createWriter(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont
): PdfWriter {
  const margin = 45;
  let y = 800;
  const state: PdfWriter = {
    page,
    y,
    margin,
    font,
    fontBold,
    doc,
    draw(text, opts) {
      const size = opts?.size ?? 10;
      const x = opts?.x ?? margin;
      const safe = toPdfText(text);
      // pdf-lib refuse les retours ligne dans drawText
      for (const part of safe.split("\n")) {
        state.page.drawText(part, {
          x,
          y: state.y,
          size,
          font: opts?.bold ? fontBold : font,
          color: opts?.color ?? rgb(0.12, 0.11, 0.14),
        });
        state.y -= size + 6;
      }
    },
    gap(n = 8) {
      state.y -= n;
    },
    ensureSpace(needed = 60) {
      if (state.y < needed) {
        state.page = doc.addPage([595, 842]);
        state.y = 800;
      }
    },
  };
  return state;
}

export async function generateInvoicePdfFromData(
  invoice: InvoiceData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const w = createWriter(doc, page, font, fontBold);
  const company = getInvoiceCompanyConfig();
  const primary = rgb(0.31, 0.22, 0.54);
  const muted = rgb(0.45, 0.43, 0.48);

  // En-tête
  w.draw(company.tradeName.toUpperCase(), { bold: true, size: 11, color: primary });
  w.draw("FACTURE", { bold: true, size: 22, color: primary });
  w.gap(4);
  w.draw(`N° ${invoice.invoiceNumber}`, { bold: true, size: 12 });
  w.draw(`Date d'émission : ${invoice.issuedAt}`, { size: 10, color: muted });
  w.gap(12);

  // Émetteur / Client (2 colonnes simplifiées)
  w.draw("ÉMETTEUR", { bold: true, size: 9, color: muted });
  w.draw(company.legalName, { bold: true, size: 10 });
  for (const line of company.addressLines) {
    w.draw(line, { size: 9 });
  }
  w.draw(company.email, { size: 9 });
  w.draw(company.website.replace(/^https?:\/\//, ""), { size: 9 });
  if (company.siret) w.draw(`SIRET : ${company.siret}`, { size: 9 });
  if (company.vatNumber) w.draw(`N° TVA : ${company.vatNumber}`, { size: 9 });
  w.gap(10);

  w.draw("CLIENT", { bold: true, size: 9, color: muted });
  w.draw(invoice.customerName, { bold: true, size: 10 });
  w.draw(invoice.customerEmail, { size: 9 });
  w.gap(16);

  // Tableau des lignes
  w.draw("DÉSIGNATION", { bold: true, size: 10, color: primary });
  w.gap(4);

  const tableTop = w.y;
  w.page.drawLine({
    start: { x: w.margin, y: tableTop },
    end: { x: 550, y: tableTop },
    thickness: 1,
    color: rgb(0.85, 0.84, 0.88),
  });
  w.gap(8);

  const lineDesc = `${invoice.description} — ${invoice.examTypeLabel}`;
  for (const line of wrapText(lineDesc, 75)) {
    w.ensureSpace();
    w.draw(line, { size: 10 });
  }
  if (invoice.planLabel) {
    w.draw(`Formule : ${invoice.planLabel}`, { size: 9, color: muted });
  }
  w.draw(
    `Accès numérique du ${invoice.periodStart} au ${invoice.periodEnd} (${invoice.subscriptionDays} jours)`,
    { size: 9, color: muted }
  );
  w.gap(8);

  w.ensureSpace();
  w.draw(`Montant TTC : ${invoice.amountFormatted}`, { bold: true, size: 12, color: primary });
  w.draw(`Devise de paiement : ${invoice.currency}`, { size: 9 });
  if (invoice.paymentMethod) {
    w.draw(`Mode de paiement : ${invoice.paymentMethod}`, { size: 9 });
  }
  if (invoice.paymentProvider) {
    w.draw(`Prestataire : ${invoice.paymentProvider}`, { size: 9 });
  }
  if (invoice.providerReference) {
    w.draw(`Réf. transaction : ${invoice.providerReference}`, { size: 9 });
  }
  w.draw(`Payé le : ${invoice.paidAt}`, { size: 9 });
  w.gap(12);

  w.ensureSpace(100);
  w.draw("MENTIONS LÉGALES", { bold: true, size: 9, color: muted });
  for (const line of wrapText(invoice.vatMention, 90)) {
    w.ensureSpace();
    w.draw(line, { size: 8, color: muted });
  }
  w.gap(6);
  const legal =
    "Facture émise automatiquement après confirmation du paiement. Prestation de services numériques d'accès à une plateforme e-learning. En cas de litige, contactez le support à l'adresse indiquée ci-dessus.";
  for (const line of wrapText(legal, 90)) {
    w.ensureSpace();
    w.draw(line, { size: 8, color: muted });
  }

  w.ensureSpace(40);
  w.draw(
    `${company.tradeName} — Document généré électroniquement, valable sans signature.`,
    { size: 7, color: muted }
  );

  return doc.save();
}

export interface ResultPdfData {
  title: string;
  studentName: string;
  completedAt: string;
  skill: string;
  percentage: number;
  nclcLevel: string;
  cecrLevel?: string;
  durationMinutes: number;
  skillScores: Array<{ label: string; value: string }>;
  corrections: string[];
  answerReviewLines?: string[];
}

export async function generateResultPdf(data: ResultPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const margin = 50;
  const lineHeight = 16;
  const primary = rgb(0.31, 0.22, 0.54);

  const drawLine = (text: string, bold = false, size = 11) => {
    if (y < 60) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
    for (const part of toPdfText(text).split("\n")) {
      page.drawText(part, {
        x: margin,
        y,
        size,
        font: bold ? fontBold : font,
        color: bold ? primary : rgb(0.15, 0.15, 0.18),
      });
      y -= lineHeight + (bold ? 4 : 0);
    }
  };

  drawLine("Objectif TCF — Rapport de résultats", true, 18);
  y -= 8;
  drawLine(data.title, true, 14);
  drawLine(`Candidat : ${data.studentName}`);
  drawLine(`Date : ${data.completedAt}`);
  drawLine(`Compétence : ${data.skill}`);
  y -= 8;
  drawLine(`Score global : ${data.percentage}%`, true);
  if (data.cecrLevel) {
    drawLine(`Niveau CECRL estime : ${data.cecrLevel}`, true);
  }
  drawLine(`Niveau NCLC : ${data.nclcLevel}`, true);
  drawLine(`Duree : ${data.durationMinutes} min`);
  y -= 8;

  if (data.skillScores.length > 0) {
    drawLine("Profil par competence", true, 13);
    for (const s of data.skillScores) {
      drawLine(`${s.label} : ${s.value}`);
    }
  }

  if (data.answerReviewLines && data.answerReviewLines.length > 0) {
    y -= 8;
    drawLine("Corrige des erreurs", true, 13);
    for (const line of data.answerReviewLines) {
      for (const part of wrapText(line, 85)) {
        drawLine(part);
      }
      y -= 2;
    }
  }

  if (data.corrections.length > 0) {
    y -= 8;
    drawLine("Corrections et feedback", true, 13);
    for (const correction of data.corrections) {
      for (const line of wrapText(correction, 85)) {
        drawLine(`• ${line}`);
      }
      y -= 4;
    }
  }

  y -= 16;
  drawLine("objectifcanada-tcf.com — Document généré automatiquement", false, 9);

  return doc.save();
}

/** @deprecated Utiliser generateInvoicePdfFromData */
export async function generateInvoicePdf(params: {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  description: string;
  examTypeLabel: string;
  amountLabel: string;
  paidAt: string;
  periodEnd: string;
}): Promise<Uint8Array> {
  return generateInvoicePdfFromData({
    invoiceNumber: params.invoiceNumber,
    issuedAt: params.paidAt.split(" ")[0] ?? params.paidAt,
    paidAt: params.paidAt,
    paymentId: "",
    providerReference: null,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    description: params.description,
    examTypeLabel: params.examTypeLabel,
    subscriptionDays: 0,
    periodStart: "—",
    periodEnd: params.periodEnd,
    amount: 0,
    currency: "XAF",
    amountFormatted: params.amountLabel,
    paymentMethod: null,
    paymentProvider: null,
    statusLabel: "Payée",
    downloadUrl: "",
    pdfDownloadUrl: "",
    companyLegalName: getInvoiceCompanyConfig().legalName,
    companyAddress: "",
    siret: null,
    vatNumber: null,
    vatMention: getInvoiceCompanyConfig().legalName,
    planLabel: null,
  });
}
