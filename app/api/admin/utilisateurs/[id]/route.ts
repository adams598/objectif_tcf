import { NextRequest } from "next/server";
import { z } from "zod";
import type { ExamType, Role, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/utils/api-response";

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "CORRECTOR"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

const grantSubscriptionSchema = z.object({
  examType: z.enum([
    "TCF_CANADA",
    "TEF_CANADA",
    "IELTS",
    "DELF",
    "DALF",
    "TOEFL",
    "AUTRE",
  ]),
  plan: z.enum(["FREE", "STARTER", "PRO", "ELITE"]).default("PRO"),
  days: z.number().int().min(1).max(365),
});

function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return unauthorizedResponse();
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return forbiddenResponse();
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
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
        phone: true,
        createdAt: true,
        currentStreak: true,
        longestStreak: true,
        totalStudyTime: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            plan: true,
            examType: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            description: true,
            createdAt: true,
          },
        },
        attempts: {
          where: { status: "COMPLETED" },
          orderBy: { completedAt: "desc" },
          take: 10,
          select: {
            id: true,
            score: true,
            percentage: true,
            nclcLevel: true,
            completedAt: true,
            series: { select: { title: true, skill: true } },
          },
        },
      },
    });

    if (!user) return notFoundResponse("Utilisateur");

    return successResponse(user);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();

    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return notFoundResponse("Utilisateur");

    if (
      parsed.data.role === "SUPER_ADMIN" &&
      admin.role !== "SUPER_ADMIN"
    ) {
      return forbiddenResponse();
    }

    const firstName = parsed.data.firstName ?? existing.firstName;
    const lastName = parsed.data.lastName ?? existing.lastName;
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || existing.name;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.firstName || parsed.data.lastName
          ? { name, firstName, lastName }
          : {}),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_USER_UPDATE",
        entity: "User",
        entityId: id,
        metadata: parsed.data,
      },
    });

    return successResponse(user, "Utilisateur mis à jour");
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const body = await req.json();

    const parsed = grantSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) return notFoundResponse("Utilisateur");

    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + parsed.data.days);

    const plan = parsed.data.plan as SubscriptionPlan;
    const isPaidPlan = plan !== "FREE";

    const subscription = await prisma.subscription.upsert({
      where: {
        userId_examType: {
          userId: id,
          examType: parsed.data.examType as ExamType,
        },
      },
      create: {
        userId: id,
        examType: parsed.data.examType as ExamType,
        plan,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: end,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        renewalDays: isPaidPlan ? parsed.data.days : null,
      },
      update: {
        plan,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: end,
        autoRenew: false,
        cancelAtPeriodEnd: false,
        renewalDays: isPaidPlan ? parsed.data.days : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_GRANT_SUBSCRIPTION",
        entity: "Subscription",
        entityId: subscription.id,
        metadata: parsed.data,
      },
    });

    return successResponse(subscription, "Abonnement accordé");
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("SUPER_ADMIN");
    const { id } = await params;

    if (id === admin.userId) {
      return forbiddenResponse();
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_USER_DELETE",
        entity: "User",
        entityId: id,
      },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
