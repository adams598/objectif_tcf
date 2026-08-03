import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import {
  encryptAdminPassword,
  generateReadablePassword,
} from "@/lib/auth/admin-password";

export async function setUserCredentials(
  userId: string,
  plainPassword?: string
): Promise<string> {
  const password = plainPassword?.trim() || generateReadablePassword(10);
  const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
  const hashed = await bcrypt.hash(password, rounds);
  const adminPasswordEnc = encryptAdminPassword(password);

  const account = await prisma.account.findFirst({
    where: { userId, provider: "credentials" },
  });

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { accessToken: hashed },
    });
  } else {
    await prisma.account.create({
      data: {
        userId,
        provider: "credentials",
        providerAccountId: userId,
        accessToken: hashed,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { adminPasswordEnc },
  });

  return password;
}

export async function clearAdminVisiblePassword(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { adminPasswordEnc: null },
  });
}
