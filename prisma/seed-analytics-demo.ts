import bcrypt from "bcryptjs";
import {
  PrismaClient,
  type ExamType,
  type Gender,
  type PaymentCurrency,
  type PaymentMethod,
  type PaymentProvider,
  type SubscriptionPlan,
} from "@prisma/client";

const DEMO_EMAIL_PREFIX = "analytics.demo.";
const DEMO_PASSWORD = "DemoAnalytics1!";

/** Inscriptions par mois (12 → 1 mois en arrière, mois courant en dernier). */
const REGISTRATIONS_PER_MONTH = [2, 3, 2, 4, 5, 4, 6, 7, 8, 6, 5, 4];

const EXAM_TYPES: ExamType[] = ["TCF_CANADA", "TEF_CANADA", "IELTS"];
const PAID_PLANS: SubscriptionPlan[] = ["STARTER", "PRO", "ELITE"];
const PROVIDERS: PaymentProvider[] = ["STRIPE", "PAWAPAY", "MOCK"];
const METHODS: PaymentMethod[] = [
  "CARD",
  "MOBILE_MONEY_MTN",
  "MOBILE_MONEY_ORANGE",
  "MOBILE_MONEY_WAVE",
];
const CURRENCIES: PaymentCurrency[] = ["XAF", "USD", "EUR", "XOF"];
const GENDERS: Gender[] = ["MALE", "FEMALE", "OTHER"];

function birthDateForAge(age: number, ref = new Date()): Date {
  const d = new Date(ref);
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(d.getMonth() - (age % 5));
  d.setDate(10);
  d.setHours(12, 0, 0, 0);
  return d;
}

function monthDate(monthsAgo: number, day = 12, hour = 10): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  d.setDate(day);
  d.setHours(hour, 30, 0, 0);
  return d;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]!;
}

function planAmount(plan: SubscriptionPlan, currency: PaymentCurrency): number {
  const base =
    plan === "STARTER" ? 10000 : plan === "PRO" ? 15000 : plan === "ELITE" ? 20000 : 0;
  if (currency === "USD") return Math.round(base / 500);
  if (currency === "EUR") return Math.round(base / 550);
  if (currency === "XOF") return Math.round(base * 1.25);
  return base;
}

async function cleanupDemoUsers(prisma: PrismaClient) {
  const demoUsers = await prisma.user.findMany({
    where: { email: { startsWith: DEMO_EMAIL_PREFIX } },
    select: { id: true },
  });

  if (demoUsers.length === 0) return;

  const userIds = demoUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { userId: { in: userIds } } });

    await tx.correction.deleteMany({
      where: {
        OR: [
          { studentId: { in: userIds } },
          { correctorId: { in: userIds } },
          { answer: { userId: { in: userIds } } },
        ],
      },
    });

    await tx.answer.deleteMany({ where: { userId: { in: userIds } } });

    const postIds = (
      await tx.communityPost.findMany({
        where: { authorId: { in: userIds } },
        select: { id: true },
      })
    ).map((p) => p.id);

    if (postIds.length > 0) {
      await tx.communityLike.deleteMany({ where: { postId: { in: postIds } } });
      await tx.communityComment.deleteMany({ where: { postId: { in: postIds } } });
      await tx.communityPost.deleteMany({ where: { id: { in: postIds } } });
    }

    await tx.communityLike.deleteMany({ where: { userId: { in: userIds } } });
    await tx.communityComment.deleteMany({ where: { authorId: { in: userIds } } });

    await tx.message.deleteMany({
      where: {
        OR: [
          { senderId: { in: userIds } },
          { receiverId: { in: userIds } },
        ],
      },
    });

    await tx.auditLog.deleteMany({ where: { userId: { in: userIds } } });

    const deleted = await tx.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`  🗑  ${deleted.count} utilisateurs démo supprimés (re-seed)`);
  });
}

export async function seedAnalyticsDemo(prisma: PrismaClient) {
  console.log("📊 Seeding données démo analytics (tableau de bord admin)…");

  const series = await prisma.examSeries.findMany({
    where: { deletedAt: null, exam: { deletedAt: null } },
    select: { id: true, exam: { select: { type: true } } },
    orderBy: { createdAt: "asc" },
    take: 24,
  });

  if (series.length === 0) {
    console.log(
      "  ⚠️  Aucune série trouvée — lancez d'abord le seed complet (npm run db:seed)"
    );
    return;
  }

  await cleanupDemoUsers(prisma);

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  let userIndex = 0;
  const createdUsers: Array<{ id: string; createdAt: Date; examTypes: ExamType[] }> =
    [];

  for (let monthsAgo = 11; monthsAgo >= 0; monthsAgo--) {
    const count =
      REGISTRATIONS_PER_MONTH[11 - monthsAgo] ?? 3;

    for (let i = 0; i < count; i++) {
      userIndex += 1;
      const createdAt = monthDate(monthsAgo, 5 + (i % 20), 8 + (i % 10));
      const examType = pick(EXAM_TYPES, userIndex);
      const email = `${DEMO_EMAIL_PREFIX}${String(userIndex).padStart(2, "0")}@objectif-tcf.test`;

      const user = await prisma.user.create({
        data: {
          email,
          name: `Utilisateur démo ${userIndex}`,
          firstName: "Demo",
          lastName: `Analytics ${userIndex}`,
          emailVerified: true,
          isActive: true,
          onboardingCompleted: true,
          country: pick(["CM", "FR", "CA", "SN", "CI"], userIndex),
          gender: pick(GENDERS, userIndex),
          birthDate: birthDateForAge(20 + (userIndex % 35)),
          createdAt,
          updatedAt: createdAt,
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          provider: "credentials",
          providerAccountId: user.id,
          accessToken: hashedPassword,
        },
      });

      await prisma.userSettings.create({ data: { userId: user.id } });

      const extraExam = userIndex % 5 === 0 ? pick(EXAM_TYPES, userIndex + 1) : null;
      const examTypes = extraExam && extraExam !== examType
        ? [examType, extraExam]
        : [examType];

      createdUsers.push({ id: user.id, createdAt, examTypes });
    }
  }

  let paymentSeq = 0;
  let attemptSeq = 0;

  for (const [idx, entry] of createdUsers.entries()) {
    const isFree = idx % 4 === 0;
    const plan: SubscriptionPlan = isFree
      ? "FREE"
      : pick(PAID_PLANS, idx);

    for (const examType of entry.examTypes) {
      const periodStart = new Date(entry.createdAt);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + (plan === "ELITE" ? 3 : plan === "PRO" ? 2 : 1));

      const subscription = await prisma.subscription.create({
        data: {
          userId: entry.id,
          examType,
          plan,
          status: periodEnd > now ? "ACTIVE" : "EXPIRED",
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          createdAt: entry.createdAt,
          updatedAt: entry.createdAt,
        },
      });

      if (!isFree && periodEnd > now) {
        const monthsSinceSignup = Math.min(
          11,
          Math.max(
            0,
            (now.getFullYear() - entry.createdAt.getFullYear()) * 12 +
              (now.getMonth() - entry.createdAt.getMonth())
          )
        );

        const paymentCount = 1 + (idx % 3);
        for (let p = 0; p < paymentCount; p++) {
          paymentSeq += 1;
          const currency = pick(CURRENCIES, paymentSeq);
          const paidAt = monthDate(
            Math.max(0, monthsSinceSignup - p),
            10 + (p % 15),
            14
          );
          const amount = planAmount(plan, currency);

          await prisma.payment.create({
            data: {
              userId: entry.id,
              subscriptionId: subscription.id,
              amount,
              currency,
              status: "SUCCEEDED",
              provider: pick(PROVIDERS, paymentSeq),
              method: pick(METHODS, paymentSeq),
              providerReference: `demo-analytics-pay-${paymentSeq}`,
              examType,
              description: `Abonnement ${plan} — ${examType}`,
              paidAt,
              createdAt: paidAt,
              updatedAt: paidAt,
              ...(currency === "XAF" && { amountXaf: amount }),
              ...(currency === "XOF" && { amountXof: amount }),
              ...(currency === "USD" && { amountUsd: amount }),
              ...(currency === "EUR" && { amountEur: amount }),
            },
          });
        }
      }
    }

    const attemptsForUser = 1 + (idx % 5);
    const matchingSeries = series.filter((s) =>
      entry.examTypes.includes(s.exam.type)
    );
    const seriesPool = matchingSeries.length > 0 ? matchingSeries : series;

    for (let a = 0; a < attemptsForUser; a++) {
      attemptSeq += 1;
      const monthsAgo = idx % 12;
      const startedAt = monthDate(monthsAgo, 8 + (a % 18), 16 + (a % 5));
      const completed = attemptSeq % 10 !== 0;
      const completedAt = completed
        ? new Date(startedAt.getTime() + (25 + (attemptSeq % 40)) * 60 * 1000)
        : null;
      const seriesItem = pick(seriesPool, attemptSeq);

      await prisma.attempt.create({
        data: {
          userId: entry.id,
          seriesId: seriesItem.id,
          status: completed ? "COMPLETED" : "IN_PROGRESS",
          startedAt,
          completedAt,
          durationSec: completed ? 1500 + (attemptSeq % 900) : null,
          score: completed ? 12 + (attemptSeq % 28) : null,
          maxScore: 40,
          percentage: completed ? 45 + (attemptSeq % 45) : null,
          createdAt: startedAt,
          updatedAt: completedAt ?? startedAt,
        },
      });
    }

    if (idx % 3 === 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);
      await prisma.session.create({
        data: {
          userId: entry.id,
          refreshToken: `demo-analytics-session-${entry.id}`,
          userAgent: "Seed Analytics Demo",
          expiresAt,
          isRevoked: false,
        },
      });
    }
  }

  console.log(
    `  ✅ ${createdUsers.length} utilisateurs démo, abonnements, paiements et tentatives créés.`
  );
  console.log(
    `  ℹ️  Comptes : ${DEMO_EMAIL_PREFIX}01@objectif-tcf.test … mot de passe : ${DEMO_PASSWORD}`
  );
}
