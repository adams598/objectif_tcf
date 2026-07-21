import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

export async function seedAdminUser(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || "Administrateur";

  if (!email || !password) {
    console.log(
      "ℹ️  Compte admin non créé (définissez ADMIN_EMAIL et ADMIN_PASSWORD dans .env)"
    );
    return;
  }

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD doit contenir au moins 8 caractères");
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
  const hashedPassword = await bcrypt.hash(password, rounds);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "SUPER_ADMIN",
        isActive: true,
        emailVerified: true,
        deletedAt: null,
        name,
      },
    });

    const account = await prisma.account.findFirst({
      where: { userId: existing.id, provider: "credentials" },
    });

    if (account) {
      await prisma.account.update({
        where: { id: account.id },
        data: { accessToken: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          userId: existing.id,
          provider: "credentials",
          providerAccountId: existing.id,
          accessToken: hashedPassword,
        },
      });
    }

    console.log(`✅ Compte admin mis à jour : ${email} (SUPER_ADMIN)`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      firstName: name.split(" ")[0] ?? "Admin",
      lastName: name.split(" ").slice(1).join(" ") || "Objectif TCF",
      role: "SUPER_ADMIN",
      emailVerified: true,
      isActive: true,
      onboardingCompleted: true,
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

  await prisma.userSettings.create({
    data: { userId: user.id },
  });

  console.log(`✅ Compte admin créé : ${email} (SUPER_ADMIN)`);
}
