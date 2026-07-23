import { PrismaClient, type ExamType } from "@prisma/client";
import { getAllTcfCanadaBankSeries } from "../lib/examen/content-bank/tcf-canada";
import { getAllTefCanadaBankSeries } from "../lib/examen/content-bank/tef-canada";
import { getAllIeltsBankSeries } from "../lib/examen/content-bank/ielts";
import type { BankSeries } from "../lib/examen/content-bank/tcf-canada";
import {
  bankQuestionToPrisma,
  enrichQuestionMedia,
} from "../lib/examen/content-bank/helpers";

interface ExamSeedConfig {
  id: string;
  type: ExamType;
  title: string;
  description: string;
  prefix: string;
  getBankSeries: () => BankSeries[];
}

const EXAM_CONFIGS: ExamSeedConfig[] = [
  {
    id: "tcf-canada-main",
    type: "TCF_CANADA",
    title: "TCF Canada",
    description:
      "Test de connaissance du français pour le Canada — préparation Objectif TCF",
    prefix: "tcf",
    getBankSeries: getAllTcfCanadaBankSeries,
  },
  {
    id: "tef-canada-main",
    type: "TEF_CANADA",
    title: "TEF Canada",
    description:
      "Test d'évaluation de français pour le Canada — préparation Objectif TCF",
    prefix: "tef",
    getBankSeries: getAllTefCanadaBankSeries,
  },
  {
    id: "ielts-main",
    type: "IELTS",
    title: "IELTS",
    description: "International English Language Testing System — préparation",
    prefix: "ielts",
    getBankSeries: getAllIeltsBankSeries,
  },
];

async function replaceSeriesQuestions(
  prisma: PrismaClient,
  seriesId: string,
  bank: BankSeries
) {
  const prepared = bank.questions.map((bq) => {
    const enriched = enrichQuestionMedia(bq, bank.skill);
    return bankQuestionToPrisma(enriched, seriesId);
  });

  await prisma.choice.deleteMany({
    where: { question: { seriesId } },
  });
  await prisma.question.deleteMany({ where: { seriesId } });

  if (prepared.length === 0) return;

  const createdQuestions = await prisma.question.createManyAndReturn({
    data: prepared.map((item) => item.question),
  });

  const choicesData = prepared.flatMap((item, index) => {
    const questionId = createdQuestions[index]?.id;
    if (!questionId || item.choices.length === 0) return [];
    return item.choices.map((choice) => ({
      ...choice,
      questionId,
    }));
  });

  if (choicesData.length > 0) {
    await prisma.choice.createMany({ data: choicesData });
  }
}

async function seedExamFromConfig(prisma: PrismaClient, config: ExamSeedConfig) {
  console.log(`  → ${config.title} : préparation des séries…`);

  const exam = await prisma.exam.upsert({
    where: { id: config.id },
    update: { title: config.title, isActive: true, deletedAt: null },
    create: {
      id: config.id,
      type: config.type,
      title: config.title,
      description: config.description,
      isActive: true,
    },
  });

  const bankSeries = config.getBankSeries();
  console.log(`  → ${config.title} : ${bankSeries.length} séries à insérer…`);

  for (let index = 0; index < bankSeries.length; index++) {
    const bank = bankSeries[index];
    const seriesId = `${config.prefix}-${bank.order}-${bank.skill.toLowerCase().replace(/_/g, "-")}`;

    const existingSeries = await prisma.examSeries.findUnique({
      where: { id: seriesId },
      select: { isCustomContent: true },
    });

    if (existingSeries?.isCustomContent) {
      console.log(
        `    ⏭ ${seriesId} ignorée (contenu personnalisé admin — non écrasé par le seed)`
      );
      continue;
    }

    const series = await prisma.examSeries.upsert({
      where: { id: seriesId },
      update: {
        title: bank.title,
        description: bank.description,
        durationMin: bank.durationMin,
        difficulty: bank.difficulty,
        order: bank.order,
        isPublished: true,
        isFree: bank.isFree,
        deletedAt: null,
        totalPoints: bank.questions.length,
        isCustomContent: false,
      },
      create: {
        id: seriesId,
        examId: exam.id,
        skill: bank.skill,
        title: bank.title,
        description: bank.description,
        durationMin: bank.durationMin,
        difficulty: bank.difficulty,
        order: bank.order,
        isPublished: true,
        isFree: bank.isFree,
        totalPoints: bank.questions.length,
        isCustomContent: false,
      },
    });

    await replaceSeriesQuestions(prisma, series.id, bank);

    if ((index + 1) % 25 === 0 || index + 1 === bankSeries.length) {
      console.log(
        `    … ${config.title} : ${index + 1}/${bankSeries.length} séries`
      );
    }
  }

  console.log(`  ✓ ${config.title} (${bankSeries.length} séries)`);
}

export async function seedExamContent(prisma: PrismaClient) {
  console.log("📝 Seeding exam content (TCF, TEF, IELTS)...");

  for (const config of EXAM_CONFIGS) {
    await seedExamFromConfig(prisma, config);
  }

  console.log("✅ Exam content seeded");
}
