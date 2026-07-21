import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import type { OfferFeature } from "@/lib/pricing/constants";
import {
  EXAM_TAB_TO_TYPE,
  calculateDynamicPrice,
  isValidPreparationDays,
  MAX_PREPARATION_DAYS,
  MIN_PREPARATION_DAYS,
  parseExamTab,
} from "@/lib/pricing/constants";

function mapOffer(offer: {
  id: string;
  examType: string;
  name: string;
  slug: string;
  subtitle: string | null;
  priceXaf: number;
  priceUsd: number;
  priceXof: number;
  baseDays: number;
  bonusDays: number;
  features: unknown;
  sortOrder: number;
}) {
  return {
    id: offer.id,
    examType: offer.examType,
    name: offer.name,
    slug: offer.slug,
    subtitle: offer.subtitle,
    priceXaf: offer.priceXaf,
    priceUsd: offer.priceUsd,
    priceXof: offer.priceXof,
    baseDays: offer.baseDays,
    bonusDays: offer.bonusDays,
    totalDays: offer.baseDays + offer.bonusDays,
    features: (offer.features as OfferFeature[]) ?? [],
    sortOrder: offer.sortOrder,
  };
}

export async function GET(req: NextRequest) {
  try {
    const examTab = parseExamTab(
      new URL(req.url).searchParams.get("examen") ??
        new URL(req.url).searchParams.get("examType")
    );
    const examType = EXAM_TAB_TO_TYPE[examTab];
    const daysParam = new URL(req.url).searchParams.get("days");
    const days = daysParam ? parseInt(daysParam, 10) : null;

    const [config, offers] = await Promise.all([
      prisma.examPricingConfig.findUnique({ where: { examType } }),
      prisma.subscriptionOffer.findMany({
        where: {
          examType,
          isActive: true,
          isFeatured: true,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
    ]);

    const pricingConfig = config ?? {
      examType,
      pricePerDayXaf: 1000,
      pricePerDayUsd: 2,
      pricePerDayXof: 1250,
    };

    const dynamicQuote =
      days && isValidPreparationDays(days)
        ? calculateDynamicPrice(days, pricingConfig)
        : null;

    return successResponse({
      examTab,
      examType,
      pricing: {
        pricePerDayXaf: pricingConfig.pricePerDayXaf,
        pricePerDayUsd: pricingConfig.pricePerDayUsd,
        pricePerDayXof: pricingConfig.pricePerDayXof,
      },
      offers: offers.map(mapOffer),
      dynamicQuote,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const examTab = parseExamTab(body.examType ?? body.examen);
    const days = parseInt(String(body.days), 10);

    if (!isValidPreparationDays(days)) {
      return validationErrorResponse({
        days: [
          `Indiquez un nombre de jours entre ${MIN_PREPARATION_DAYS} et ${MAX_PREPARATION_DAYS}`,
        ],
      });
    }

    const examType = EXAM_TAB_TO_TYPE[examTab];
    const config = await prisma.examPricingConfig.findUnique({
      where: { examType },
    });

    const pricingConfig = config ?? {
      examType,
      pricePerDayXaf: 1000,
      pricePerDayUsd: 2,
      pricePerDayXof: 1250,
    };

    return successResponse({
      examTab,
      quote: calculateDynamicPrice(days, pricingConfig),
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
