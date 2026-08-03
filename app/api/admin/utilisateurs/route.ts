import { NextRequest } from "next/server";
import { z } from "zod";
import type { ExamType, Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { decryptAdminPassword } from "@/lib/auth/admin-password";
import { setUserCredentials } from "@/lib/admin/learner-credentials";
import { inferSubscriptionPlan } from "@/lib/payments/plan-from-offer";
import { sendLearnerCredentialsEmail } from "@/lib/email/send-offer-access-email";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  errorResponse,
} from "@/lib/utils/api-response";

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

const createLearnerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  password: z.string().min(8).max(64).optional(),
  offerId: z.string().uuid().optional().nullable(),
  sendEmail: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const role = searchParams.get("role") as Role | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20", 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          emailVerified: true,
          country: true,
          createdAt: true,
          currentStreak: true,
          totalStudyTime: true,
          adminPasswordEnc: true,
          subscriptions: {
            where: { status: "ACTIVE", currentPeriodEnd: { gt: new Date() } },
            select: {
              id: true,
              plan: true,
              examType: true,
              status: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
              offerId: true,
              renewalDays: true,
              autoRenew: true,
            },
          },
          _count: { select: { attempts: true, payments: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return successResponse({
      users: users.map(({ adminPasswordEnc, ...user }) => ({
        ...user,
        password: decryptAdminPassword(adminPasswordEnc),
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const parsed = createLearnerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existing) {
      return errorResponse("Un compte existe déjà avec cet email", 409);
    }

    const firstName = parsed.data.firstName?.trim() || null;
    const lastName = parsed.data.lastName?.trim() || null;
    const name =
      [firstName, lastName].filter(Boolean).join(" ") ||
      email.split("@")[0] ||
      "Apprenant";

    let offer: {
      id: string;
      name: string;
      slug: string;
      examType: ExamType;
      baseDays: number;
      bonusDays: number;
    } | null = null;

    if (parsed.data.offerId) {
      offer = await prisma.subscriptionOffer.findFirst({
        where: {
          id: parsed.data.offerId,
          isActive: true,
          deletedAt: null,
        },
      });
      if (!offer) {
        return errorResponse("Offre introuvable ou inactive", 404);
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        name,
        firstName,
        lastName,
        role: "USER",
        emailVerified: true,
        isActive: true,
        settings: { create: {} },
      },
    });

    const password = await setUserCredentials(user.id, parsed.data.password);

    let periodEnd: Date | null = null;
    if (offer) {
      const days = offer.baseDays + offer.bonusDays;
      const now = new Date();
      periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + days);
      const plan = inferSubscriptionPlan({
        offerName: offer.name,
        offerSlug: offer.slug,
        subscriptionDays: days,
      });

      await prisma.subscription.create({
        data: {
          userId: user.id,
          examType: offer.examType,
          plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          autoRenew: false,
          cancelAtPeriodEnd: false,
          renewalDays: days,
          offerId: offer.id,
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { targetExamDate: periodEnd },
      });
    }

    let emailSent = false;
    if (parsed.data.sendEmail !== false) {
      const sendResult = await sendLearnerCredentialsEmail({
        to: email,
        recipientName: name,
        adminName: admin.name || admin.email,
        password,
        offerName: offer?.name,
        days: offer ? offer.baseDays + offer.bonusDays : null,
      });
      emailSent = sendResult.ok;
    }

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_LEARNER_CREATE",
        entity: "User",
        entityId: user.id,
        metadata: {
          email,
          offerId: offer?.id ?? null,
          emailSent,
        },
      },
    });

    return createdResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        password,
        emailSent,
        periodEnd: periodEnd?.toISOString() ?? null,
      },
      "Apprenant créé"
    );
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
