import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ResultPdfData {
  title: string;
  studentName: string;
  completedAt: string;
  skill: string;
  percentage: number;
  nclcLevel: string;
  durationMinutes: number;
  skillScores: Array<{ label: string; value: string }>;
  corrections: string[];
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
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
    page.drawText(text, {
      x: margin,
      y,
      size,
      font: bold ? fontBold : font,
      color: bold ? primary : rgb(0.15, 0.15, 0.18),
    });
    y -= lineHeight + (bold ? 4 : 0);
  };

  drawLine("Objectif TCF — Rapport de résultats", true, 18);
  y -= 8;
  drawLine(data.title, true, 14);
  drawLine(`Candidat : ${data.studentName}`);
  drawLine(`Date : ${data.completedAt}`);
  drawLine(`Compétence : ${data.skill}`);
  y -= 8;
  drawLine(`Score global : ${data.percentage}%`, true);
  drawLine(`Niveau NCLC : ${data.nclcLevel}`, true);
  drawLine(`Durée : ${data.durationMinutes} min`);
  y -= 8;

  drawLine("Profil par compétence", true, 13);
  for (const s of data.skillScores) {
    drawLine(`${s.label} : ${s.value}`);
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
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const primary = rgb(0.31, 0.22, 0.54);

  let y = 780;
  const draw = (text: string, bold = false, size = 11) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: bold ? fontBold : font,
      color: bold ? primary : rgb(0.15, 0.15, 0.18),
    });
    y -= 18;
  };

  draw("Objectif TCF — Facture d'abonnement", true, 16);
  draw(params.invoiceNumber, true, 12);
  y -= 8;
  draw(`Client : ${params.customerName}`);
  draw(`Email : ${params.customerEmail}`);
  y -= 8;
  draw(`Produit : ${params.description}`);
  draw(`Examen : ${params.examTypeLabel}`);
  draw(`Montant : ${params.amountLabel}`, true);
  draw(`Payé le : ${params.paidAt}`);
  draw(`Validité jusqu'au : ${params.periodEnd}`);

  return doc.save();
}
