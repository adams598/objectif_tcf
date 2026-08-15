import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { LegalContent, LegalListItem, LegalSection } from "@/lib/marketing/content/legal";
import type { InvoiceCompanyConfig } from "@/lib/invoices/company-config";
import { getInvoiceCompanyConfig } from "@/lib/invoices/company-config";

function toPdfText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
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
  const words = toPdfText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word.length > maxChars ? word.slice(0, maxChars) : word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function generateLegalPdf(
  content: LegalContent,
  issuer?: InvoiceCompanyConfig
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const company = issuer ?? getInvoiceCompanyConfig();
  const primary = rgb(0.31, 0.22, 0.54);
  const muted = rgb(0.45, 0.43, 0.48);
  const body = rgb(0.12, 0.11, 0.14);
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const maxChars = 92;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = 800;

  const newPage = () => {
    page = doc.addPage([pageWidth, pageHeight]);
    y = 800;
  };

  const ensure = (needed = 48) => {
    if (y < needed) newPage();
  };

  const draw = (
    text: string,
    opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> }
  ) => {
    const size = opts?.size ?? 10;
    const safe = toPdfText(text);
    for (const part of safe.split("\n")) {
      ensure(size + 16);
      page.drawText(part, {
        x: margin,
        y,
        size,
        font: opts?.bold ? fontBold : font,
        color: opts?.color ?? body,
      });
      y -= size + 5;
    }
  };

  const drawWrapped = (
    text: string,
    opts?: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb>; indent?: number }
  ) => {
    const size = opts?.size ?? 10;
    const indent = opts?.indent ?? 0;
    for (const line of wrapText(text, maxChars - Math.ceil(indent / 5))) {
      ensure(size + 16);
      page.drawText(toPdfText(line), {
        x: margin + indent,
        y,
        size,
        font: opts?.bold ? fontBold : font,
        color: opts?.color ?? body,
      });
      y -= size + 4;
    }
  };

  draw(company.tradeName.toUpperCase(), { bold: true, size: 11, color: primary });
  draw(content.title, { bold: true, size: 16, color: primary });
  y -= 4;
  draw(content.lastUpdated, { size: 9, color: muted });
  const siteHost = company.website.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (siteHost) {
    draw(siteHost, { size: 9, color: muted });
  }
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 1,
    color: rgb(0.85, 0.84, 0.88),
  });
  y -= 16;

  const drawList = (items: LegalListItem[], depth = 0) => {
    for (const item of items) {
      drawWrapped(`- ${item.text}`, { size: 10, indent: depth * 14 });
      if (item.children?.length) drawList(item.children, depth + 1);
    }
  };

  const drawSection = (section: LegalSection, level: 1 | 2 | 3) => {
    y -= level === 1 ? 10 : 6;
    ensure(70);
    draw(section.title, {
      bold: true,
      size: level === 1 ? 12 : 11,
      color: primary,
    });
    y -= 2;

    for (const paragraph of section.paragraphs ?? []) {
      drawWrapped(paragraph, { size: 10 });
      y -= 4;
    }

    if (section.list?.length) {
      drawList(section.list);
      y -= 4;
    }

    for (const paragraph of section.paragraphsAfterList ?? []) {
      drawWrapped(paragraph, { size: 10 });
      y -= 4;
    }

    if (section.listAfterParagraphs?.length) {
      drawList(section.listAfterParagraphs);
      y -= 4;
    }

    for (const subsection of section.subsections ?? []) {
      drawSection(subsection, level === 1 ? 2 : 3);
    }
  };

  for (const section of content.sections) {
    drawSection(section, 1);
  }

  y -= 12;
  ensure(40);
  draw(
    `Document genere automatiquement — ${company.tradeName} — ${company.email}`,
    { size: 8, color: muted }
  );

  return doc.save();
}
