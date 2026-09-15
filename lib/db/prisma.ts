import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

function isStaleClient(client: PrismaClient) {
  const record = client as unknown as {
    skillGuide?: unknown;
    skillGuideCombination?: unknown;
  };
  return (
    typeof record.skillGuide === "undefined" ||
    typeof record.skillGuideCombination === "undefined"
  );
}

const existing = globalForPrisma.prisma;
export const prisma =
  existing && !isStaleClient(existing) ? existing : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else {
  globalForPrisma.prisma ??= prisma;
}

export default prisma;
