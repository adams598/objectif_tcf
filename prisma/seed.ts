import { PrismaClient, type ExamType, type Prisma } from "@prisma/client";
import type { OfferFeature } from "../lib/pricing/constants";
import { seedExamContent } from "./seed-content";
import { seedAdminUser } from "./seed-admin";

const prisma = new PrismaClient();

const TCF_FEATURES: OfferFeature[] = [
  { label: "Sujets d'actualité", included: true },
  {
    label: "Tableau de bord pour revoir ses anciennes corrections",
    included: true,
  },
  { label: "C1/C2 garanti", included: true },
  { label: "Sujets récents TCF / TEF / IELTS", included: true },
  {
    label: "Sujets de compréhension avec correction détaillée instantanée",
    included: true,
  },
  { label: "CE, avec + 1500 questions et corrections", included: true },
  { label: "CO, avec + 1500 questions et corrections", included: true },
  {
    label: "Méthodologie approfondie des sujets d'expression et de compréhension",
    included: true,
  },
  { label: "Groupe WhatsApp privé.", included: true },
  {
    label:
      "Sujets d'expression écrite dans les conditions d'examen avec compteur de mots, sans Correcteur de fautes, 3 tâches avec correction personnelle par un examinateur (Sujets illimités)",
    included: true,
  },
  {
    label:
      "Sujets d'expression orale dans les conditions d'examen avec examinateur virtuel, correction par un examinateur, 3 tâches (Sujets illimités)",
    included: true,
  },
];

const IELTS_FEATURES: OfferFeature[] = [
  { label: "Sujets d'actualité IELTS", included: true },
  { label: "Simulations Reading & Listening", included: true },
  { label: "Correction Writing Task 1 & 2", included: true },
  { label: "Préparation Speaking avec examinateur", included: true },
  { label: "Tableau de bord de progression", included: true },
  { label: "Groupe WhatsApp privé.", included: true },
];

interface OfferSeed {
  examType: ExamType;
  name: string;
  slug: string;
  subtitle?: string;
  priceXaf: number;
  priceUsd: number;
  priceXof: number;
  baseDays: number;
  bonusDays: number;
  features: OfferFeature[];
  sortOrder: number;
  whatsappIncluded?: boolean;
}

function withWhatsapp(features: OfferFeature[], included: boolean): OfferFeature[] {
  return features.map((feature) =>
    feature.label.includes("WhatsApp")
      ? { ...feature, included }
      : feature
  );
}

const OFFERS: OfferSeed[] = [
  // TCF
  {
    examType: "TCF_CANADA",
    name: "TCF APPROFONDI 45",
    slug: "tcf-approfondi-45",
    priceXaf: 20000,
    priceUsd: 40,
    priceXof: 25000,
    baseDays: 30,
    bonusDays: 15,
    features: TCF_FEATURES,
    sortOrder: 1,
  },
  {
    examType: "TCF_CANADA",
    name: "TCF INTENSE 30",
    slug: "tcf-intense-30",
    priceXaf: 15000,
    priceUsd: 30,
    priceXof: 17500,
    baseDays: 20,
    bonusDays: 10,
    features: TCF_FEATURES,
    sortOrder: 2,
  },
  {
    examType: "TCF_CANADA",
    name: "TCF DECOUVERTE 15",
    slug: "tcf-decouverte-15",
    priceXaf: 10000,
    priceUsd: 20,
    priceXof: 12500,
    baseDays: 10,
    bonusDays: 5,
    features: withWhatsapp(TCF_FEATURES, false),
    sortOrder: 3,
    whatsappIncluded: false,
  },
  // TEF (même structure initiale)
  {
    examType: "TEF_CANADA",
    name: "TEF APPROFONDI 45",
    slug: "tef-approfondi-45",
    priceXaf: 20000,
    priceUsd: 40,
    priceXof: 25000,
    baseDays: 30,
    bonusDays: 15,
    features: TCF_FEATURES.map((f) => ({
      ...f,
      label: f.label.replace("TCF", "TEF"),
    })),
    sortOrder: 1,
  },
  {
    examType: "TEF_CANADA",
    name: "TEF INTENSE 30",
    slug: "tef-intense-30",
    priceXaf: 15000,
    priceUsd: 30,
    priceXof: 17500,
    baseDays: 20,
    bonusDays: 10,
    features: TCF_FEATURES.map((f) => ({
      ...f,
      label: f.label.replace("TCF", "TEF"),
    })),
    sortOrder: 2,
  },
  {
    examType: "TEF_CANADA",
    name: "TEF DECOUVERTE 15",
    slug: "tef-decouverte-15",
    priceXaf: 10000,
    priceUsd: 20,
    priceXof: 12500,
    baseDays: 10,
    bonusDays: 5,
    features: withWhatsapp(
      TCF_FEATURES.map((f) => ({
        ...f,
        label: f.label.replace("TCF", "TEF"),
      })),
      false
    ),
    sortOrder: 3,
  },
  // IELTS
  {
    examType: "IELTS",
    name: "IELTS 60",
    slug: "ielts-60",
    subtitle: "IELTS SOUSCRIPTION",
    priceXaf: 15000,
    priceUsd: 35,
    priceXof: 17500,
    baseDays: 45,
    bonusDays: 15,
    features: IELTS_FEATURES,
    sortOrder: 1,
  },
  {
    examType: "IELTS",
    name: "IELTS 30",
    slug: "ielts-30",
    subtitle: "IELTS Souscription",
    priceXaf: 10000,
    priceUsd: 25,
    priceXof: 12500,
    baseDays: 20,
    bonusDays: 10,
    features: IELTS_FEATURES,
    sortOrder: 2,
  },
  {
    examType: "IELTS",
    name: "IELTS DECOUVERTE 15",
    slug: "ielts-decouverte-15",
    subtitle: "IELTS Souscription",
    priceXaf: 7500,
    priceUsd: 15,
    priceXof: 9375,
    baseDays: 10,
    bonusDays: 5,
    features: withWhatsapp(IELTS_FEATURES, false),
    sortOrder: 3,
  },
];

const PRICING_CONFIGS: Array<{
  examType: ExamType;
  pricePerDayXaf: number;
  pricePerDayUsd: number;
  pricePerDayXof: number;
}> = [
  { examType: "TCF_CANADA", pricePerDayXaf: 1000, pricePerDayUsd: 2, pricePerDayXof: 1250 },
  { examType: "TEF_CANADA", pricePerDayXaf: 1000, pricePerDayUsd: 2, pricePerDayXof: 1250 },
  { examType: "IELTS", pricePerDayXaf: 1000, pricePerDayUsd: 2, pricePerDayXof: 1250 },
];

async function main() {
  console.log("🌱 Seeding pricing configs and offers...");

  for (const config of PRICING_CONFIGS) {
    await prisma.examPricingConfig.upsert({
      where: { examType: config.examType },
      create: config,
      update: config,
    });
  }

  for (const offer of OFFERS) {
    await prisma.subscriptionOffer.upsert({
      where: {
        examType_slug: {
          examType: offer.examType,
          slug: offer.slug,
        },
      },
      create: {
        examType: offer.examType,
        name: offer.name,
        slug: offer.slug,
        subtitle: offer.subtitle,
        priceXaf: offer.priceXaf,
        priceUsd: offer.priceUsd,
        priceXof: offer.priceXof,
        baseDays: offer.baseDays,
        bonusDays: offer.bonusDays,
        features: offer.features as unknown as Prisma.InputJsonValue,
        sortOrder: offer.sortOrder,
        isFeatured: true,
        isActive: true,
      },
      update: {
        name: offer.name,
        subtitle: offer.subtitle,
        priceXaf: offer.priceXaf,
        priceUsd: offer.priceUsd,
        priceXof: offer.priceXof,
        baseDays: offer.baseDays,
        bonusDays: offer.bonusDays,
        features: offer.features as unknown as Prisma.InputJsonValue,
        sortOrder: offer.sortOrder,
        isFeatured: true,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  console.log(`✅ ${PRICING_CONFIGS.length} tarifications et ${OFFERS.length} offres créées.`);

  await seedAdminUser(prisma);
  await seedExamContent(prisma);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
