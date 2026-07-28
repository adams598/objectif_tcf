import { NextRequest } from "next/server";
import type { ExamType, Gender, PaymentMethod } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { fetchAdminAnalytics } from "@/lib/admin/analytics";
import type { AnalyticsPeriodType } from "@/lib/admin/analytics-period";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const EXAM_TYPES = [
  "TCF_CANADA",
  "TEF_CANADA",
  "IELTS",
  "DELF",
  "DALF",
  "TOEFL",
  "AUTRE",
] as const;

const PERIOD_TYPES = ["rolling", "year", "month", "monthPair"] as const;

const GENDERS = ["MALE", "FEMALE", "OTHER", "UNSPECIFIED"] as const;

const PAYMENT_METHODS = [
  "CARD",
  "MOBILE_MONEY",
  "MOBILE_MONEY_MTN",
  "MOBILE_MONEY_ORANGE",
  "MOBILE_MONEY_AIRTEL",
  "MOBILE_MONEY_WAVE",
  "MOBILE_MONEY_MOOV",
  "PAYPAL",
  "GOOGLE_PAY",
  "BANK_TRANSFER",
  "SEPA",
  "UNKNOWN",
] as const;

function parseOptionalInt(value: string | null, min: number, max: number) {
  if (!value?.trim()) return null;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const examTypeRaw = searchParams.get("examType");
    const periodTypeRaw = searchParams.get("periodType");

    const examType =
      examTypeRaw && EXAM_TYPES.includes(examTypeRaw as (typeof EXAM_TYPES)[number])
        ? (examTypeRaw as ExamType)
        : null;

    const periodType =
      periodTypeRaw &&
      PERIOD_TYPES.includes(periodTypeRaw as (typeof PERIOD_TYPES)[number])
        ? (periodTypeRaw as AnalyticsPeriodType)
        : "rolling";

    const months = parseOptionalInt(searchParams.get("months"), 1, 24) ?? 6;
    const year = parseOptionalInt(searchParams.get("year"), 2000, 2100);
    const month = parseOptionalInt(searchParams.get("month"), 1, 12);
    const monthPairStart = parseOptionalInt(
      searchParams.get("monthPairStart"),
      1,
      11
    );

    const countryRaw = searchParams.get("country");
    const country =
      countryRaw && countryRaw !== "ALL" ? countryRaw.trim() : null;

    const paymentMethodRaw = searchParams.get("paymentMethod");
    const paymentMethod =
      paymentMethodRaw &&
      paymentMethodRaw !== "ALL" &&
      PAYMENT_METHODS.includes(paymentMethodRaw as (typeof PAYMENT_METHODS)[number])
        ? (paymentMethodRaw as PaymentMethod)
        : null;

    const genderRaw = searchParams.get("gender");
    const gender =
      genderRaw &&
      genderRaw !== "ALL" &&
      GENDERS.includes(genderRaw as (typeof GENDERS)[number])
        ? (genderRaw as Gender)
        : null;

    const ageMin = parseOptionalInt(searchParams.get("ageMin"), 0, 120);
    const ageMax = parseOptionalInt(searchParams.get("ageMax"), 0, 120);
    const ageExact = parseOptionalInt(searchParams.get("ageExact"), 0, 120);

    const data = await fetchAdminAnalytics({
      examType,
      periodType,
      months,
      year,
      month,
      monthPairStart,
      country,
      paymentMethod,
      gender,
      ageMin,
      ageMax,
      ageExact,
    });

    return successResponse(data);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
