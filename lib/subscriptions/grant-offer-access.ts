import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import type { ExamType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { inferSubscriptionPlan } from "@/lib/payments/plan-from-offer";
import { sendOfferAccessEmail } from "@/lib/email/send-offer-access-email";
import { EXAM_TYPE_TO_TAB, EXAM_TAB_LABELS } from "@/lib/pricing/constants";

export type GrantOfferAccessResult = {
  email: string;
  status: "granted" | "failed";
  isNewUser: boolean;
  emailSent: boolean;
  periodEnd?: string;
  error?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "Apprenant";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase()) || "Apprenant";
}

function formatPeriodEnd(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function grantOfferAccessByEmails(input: {
  emails: string[];
  offerId: string;
  admin: { userId: string; name: string; email: string };
}): Promise<{
  offerName: string;
  days: number;
  results: GrantOfferAccessResult[];
}> {
  const offer = await prisma.subscriptionOffer.findFirst({
    where: { id: input.offerId, isActive: true, deletedAt: null },
  });

  if (!offer) {
    throw new Error("OFFER_NOT_FOUND");
  }

  const days = offer.baseDays + offer.bonusDays;
  if (days < 1) {
    throw new Error("OFFER_INVALID_DAYS");
  }

  const plan = inferSubscriptionPlan({
    offerName: offer.name,
    offerSlug: offer.slug,
    subscriptionDays: days,
  });

  const examType = offer.examType as ExamType;
  const examLabel =
    EXAM_TAB_LABELS[EXAM_TYPE_TO_TAB[examType] ?? "tcf"] ?? examType;

  const uniqueEmails = [
    ...new Set(input.emails.map(normalizeEmail).filter(Boolean)),
  ];

  const results: GrantOfferAccessResult[] = [];

  for (const email of uniqueEmails) {
    try {
      const existing = await prisma.user.findFirst({
        where: { email, deletedAt: null },
        include: { accounts: { where: { provider: "credentials" }, take: 1 } },
      });

      let userId: string;
      let recipientName: string;
      let isNewUser = false;
      let setupToken: string | null = null;

      if (existing) {
        userId = existing.id;
        recipientName = existing.name || displayNameFromEmail(email);
      } else {
        isNewUser = true;
        recipientName = displayNameFromEmail(email);
        const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
        const tempPassword = randomBytes(24).toString("hex");
        const hashedPassword = await bcrypt.hash(tempPassword, rounds);

        const created = await prisma.user.create({
          data: {
            email,
            name: recipientName,
            emailVerified: true,
            accounts: {
              create: {
                provider: "credentials",
                providerAccountId: randomUUID(),
                accessToken: hashedPassword,
              },
            },
            settings: { create: {} },
          },
        });
        userId = created.id;

        setupToken = randomUUID();
        await prisma.passwordReset.create({
          data: {
            userId,
            token: setupToken,
            // Invitation : 7 jours pour définir le mot de passe
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Compte existant sans credentials : créer un reset pour qu'il puisse se connecter
      if (
        existing &&
        existing.accounts.length === 0
      ) {
        isNewUser = true;
        setupToken = randomUUID();
        await prisma.passwordReset.create({
          data: {
            userId,
            token: setupToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
        const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
        const tempPassword = randomBytes(24).toString("hex");
        await prisma.account.create({
          data: {
            userId,
            provider: "credentials",
            providerAccountId: userId,
            accessToken: await bcrypt.hash(tempPassword, rounds),
          },
        });
      }

      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() + days);

      const existingSub = await prisma.subscription.findUnique({
        where: { userId_examType: { userId, examType } },
      });

      let finalEnd = periodEnd;
      if (existingSub && existingSub.currentPeriodEnd > now) {
        // Prolonge à partir de la fin actuelle si déjà abonné
        finalEnd = new Date(existingSub.currentPeriodEnd);
        finalEnd.setDate(finalEnd.getDate() + days);
      }

      const subscription = await prisma.subscription.upsert({
        where: { userId_examType: { userId, examType } },
        create: {
          userId,
          examType,
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
        where: { id: userId },
        data: { targetExamDate: subscription.currentPeriodEnd },
      });

      const emailResult = await sendOfferAccessEmail({
        to: email,
        recipientName,
        adminName: input.admin.name || input.admin.email,
        offerName: offer.name,
        examLabel,
        days,
        periodEndLabel: formatPeriodEnd(subscription.currentPeriodEnd),
        isNewUser: Boolean(setupToken),
        setupToken,
      });

      await prisma.auditLog.create({
        data: {
          userId: input.admin.userId,
          action: "ADMIN_GRANT_OFFER_ACCESS",
          entity: "Subscription",
          entityId: subscription.id,
          metadata: {
            email,
            offerId: offer.id,
            offerName: offer.name,
            days,
            isNewUser,
            emailSent: emailResult.ok,
            grantedBy: input.admin.email,
          },
        },
      });

      results.push({
        email,
        status: "granted",
        isNewUser,
        emailSent: emailResult.ok,
        periodEnd: subscription.currentPeriodEnd.toISOString(),
        error: emailResult.ok ? undefined : emailResult.error,
      });
    } catch (error) {
      results.push({
        email,
        status: "failed",
        isNewUser: false,
        emailSent: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }

  return {
    offerName: offer.name,
    days,
    results,
  };
}
