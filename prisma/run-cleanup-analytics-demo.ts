import { PrismaClient } from "@prisma/client";
import { cleanupAnalyticsDemoUsers } from "./cleanup-analytics-demo";

const prisma = new PrismaClient();

cleanupAnalyticsDemoUsers(prisma)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
