import { PrismaClient } from "@prisma/client";
import { seedAnalyticsDemo } from "./seed-analytics-demo";

const prisma = new PrismaClient();

seedAnalyticsDemo(prisma)
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
