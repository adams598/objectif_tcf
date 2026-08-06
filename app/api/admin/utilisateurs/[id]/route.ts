import { NextRequest } from "next/server";
import { z } from "zod";
import type { ExamType, Role, SubscriptionPlan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import { decryptAdminPassword } from "@/lib/auth/admin-password";
import { setUserCredentials } from "@/lib/admin/learner-credentials";
import {
  archiveUser,
  permanentlyDeleteUser,
} from "@/lib/admin/user-removal";
import { inferSubscriptionPlan } from "@/lib/payments/plan-from-offer";
import { sendOfferAccessEmail } from "@/lib/email/send-offer-access-email";
import { EXAM_TYPE_TO_TAB, EXAM_TAB_LABELS } from "@/lib/pricing/constants";
import {
  successResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse,
} from "@/lib/utils/api-response";

const updateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN", "CORRECTOR"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().min(1).max(50).optional().nullable(),
  lastName: z.string().min(1).max(50).optional().nullable(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(64).optional(),
  /** Accorder / remplacer l'accès via une offre (durée = offre) */
  offerId: z.string().uuid().optional().nullable(),
  /** Retirer l'accès pour un type d'examen */
  revokeExamType: z
    .enum(["TCF_CANADA", "TEF_CANADA", "IELTS"])
    .optional()
    .nullable(),
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
        adminPasswordEnc: true,
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
            offerId: true,
            renewalDays: true,
            autoRenew: true,
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

    const { adminPasswordEnc, ...rest } = user;
    return successResponse({
      ...rest,
      password: decryptAdminPassword(adminPasswordEnc),
    });
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

    if (parsed.data.email) {
      const email = parsed.data.email.trim().toLowerCase();
      const conflict = await prisma.user.findFirst({
        where: { email, deletedAt: null, NOT: { id } },
      });
      if (conflict) {
        return errorResponse("Cet email est déjà utilisé", 409);
      }
    }

    const firstName =
      parsed.data.firstName !== undefined
        ? parsed.data.firstName
        : existing.firstName;
    const lastName =
      parsed.data.lastName !== undefined
        ? parsed.data.lastName
        : existing.lastName;
    const name =
      [firstName, lastName].filter(Boolean).join(" ") || existing.name;

    let plainPassword: string | null = null;
    if (parsed.data.password) {
      plainPassword = await setUserCredentials(id, parsed.data.password);
    }

    let accessEmailSent = false;
    let accessEmailError: string | null = null;
    let grantedOfferName: string | null = null;

    if (parsed.data.offerId) {
      const offer = await prisma.subscriptionOffer.findFirst({
        where: {
          id: parsed.data.offerId,
          isActive: true,
          deletedAt: null,
        },
      });
      if (!offer) return errorResponse("Offre introuvable", 404);

      const days = offer.baseDays + offer.bonusDays;
      const now = new Date();
      const end = new Date(now);
      end.setDate(end.getDate() + days);
      const plan = inferSubscriptionPlan({
        offerName: offer.name,
        offerSlug: offer.slug,
        subscriptionDays: days,
      });

      const existingSub = await prisma.subscription.findUnique({
        where: {
          userId_examType: { userId: id, examType: offer.examType },
        },
      });

      let finalEnd = end;
      if (existingSub && existingSub.currentPeriodEnd > now) {
        finalEnd = new Date(existingSub.currentPeriodEnd);
        finalEnd.setDate(finalEnd.getDate() + days);
      }

      await prisma.subscription.upsert({
        where: {
          userId_examType: { userId: id, examType: offer.examType },
        },
        create: {
          userId: id,
          examType: offer.examType,
          plan,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: finalEnd,
          autoRenew: false,
          cancelAtPeriodEnd: false,
          renewalDays: days,
          offerId: offer.id,
        },
        update: {
          plan,
          status: "ACTIVE",
          currentPeriodStart:
            existingSub && existingSub.currentPeriodEnd > now
              ? existingSub.currentPeriodStart
              : now,
          currentPeriodEnd: finalEnd,
          autoRenew: false,
          cancelAtPeriodEnd: false,
          renewalDays: days,
          offerId: offer.id,
        },
      });

      await prisma.user.update({
        where: { id },
        data: { targetExamDate: finalEnd },
      });

      // Ne jamais écraser le mdp d'un compte existant à l'octroi d'offre.
      // Envoie le mdp en clair seulement s'il a été fourni / déjà visible admin.
      // Exception : compte sans credentials (ex. OAuth seul) → en crée un.
      let passwordForEmail =
        plainPassword ?? decryptAdminPassword(existing.adminPasswordEnc);
      if (!passwordForEmail) {
        const hasCredentials = await prisma.account.findFirst({
          where: { userId: id, provider: "credentials" },
          select: { id: true },
        });
        if (!hasCredentials) {
          passwordForEmail = await setUserCredentials(id);
          plainPassword = passwordForEmail;
        }
      }

      const examLabel =
        EXAM_TAB_LABELS[EXAM_TYPE_TO_TAB[offer.examType] ?? "tcf"] ??
        offer.examType;
      const recipientName =
        [firstName, lastName].filter(Boolean).join(" ") ||
        existing.name ||
        existing.email;
      const periodEndLabel = finalEnd.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      const emailResult = await sendOfferAccessEmail({
        to: (parsed.data.email ?? existing.email).trim().toLowerCase(),
        recipientName,
        adminName: admin.name || admin.email,
        offerName: offer.name,
        examLabel,
        days,
        periodEndLabel,
        password: passwordForEmail,
      });
      accessEmailSent = emailResult.ok;
      grantedOfferName = offer.name;
      if (!emailResult.ok) {
        accessEmailError =
          "error" in emailResult
            ? emailResult.error
            : "Échec d'envoi de l'email d'accès";
      }
    }

    if (parsed.data.revokeExamType) {
      await prisma.subscription.updateMany({
        where: {
          userId: id,
          examType: parsed.data.revokeExamType as ExamType,
        },
        data: {
          status: "CANCELLED",
          autoRenew: false,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: new Date(),
        },
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(parsed.data.role ? { role: parsed.data.role as Role } : {}),
        ...(parsed.data.isActive !== undefined
          ? { isActive: parsed.data.isActive }
          : {}),
        ...(parsed.data.email
          ? { email: parsed.data.email.trim().toLowerCase() }
          : {}),
        ...(parsed.data.firstName !== undefined ||
        parsed.data.lastName !== undefined
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
        name: true,
        adminPasswordEnc: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_USER_UPDATE",
        entity: "User",
        entityId: id,
        metadata: {
          ...parsed.data,
          password: parsed.data.password ? "[updated]" : undefined,
          accessEmailSent,
          accessEmailError,
          grantedOfferName,
        },
      },
    });

    return successResponse(
      {
        ...user,
        adminPasswordEnc: undefined,
        password:
          plainPassword ?? decryptAdminPassword(user.adminPasswordEnc),
        accessEmailSent,
        accessEmailError,
        grantedOfferName,
      },
      grantedOfferName
        ? accessEmailSent
          ? `Accès « ${grantedOfferName} » accordé — email envoyé`
          : `Accès « ${grantedOfferName} » accordé — email non envoyé${
              accessEmailError ? ` : ${accessEmailError}` : ""
            }`
        : "Utilisateur mis à jour"
    );
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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const { id } = await params;
    const modeParam = new URL(req.url).searchParams.get("mode");
    const mode = modeParam === "permanent" ? "permanent" : "archive";

    if (id === admin.userId) {
      return forbiddenResponse();
    }

    const existing = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return notFoundResponse("Utilisateur");

    if (existing.role !== "USER" && admin.role !== "SUPER_ADMIN") {
      return forbiddenResponse();
    }

    if (mode === "permanent") {
      await permanentlyDeleteUser(prisma, id);
      await prisma.auditLog.create({
        data: {
          userId: admin.userId,
          action: "ADMIN_USER_HARD_DELETE",
          entity: "User",
          entityId: id,
          metadata: { email: existing.email, mode: "permanent" },
        },
      });
      return successResponse(
        { deleted: true, mode: "permanent" },
        "Utilisateur définitivement supprimé"
      );
    }

    await archiveUser(prisma, id);
    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_USER_ARCHIVE",
        entity: "User",
        entityId: id,
        metadata: { email: existing.email, mode: "archive" },
      },
    });

    return successResponse(
      { deleted: true, mode: "archive" },
      "Utilisateur archivé"
    );
  } catch (error) {
    const auth = handleAuthError(error);
    if (auth) return auth;

    console.error("[ADMIN_USER_DELETE]", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Une erreur interne est survenue";
    // Message Prisma plus utile pour l'admin (contraintes FK, etc.)
    return errorResponse(message.slice(0, 300), 500);
  }
}
