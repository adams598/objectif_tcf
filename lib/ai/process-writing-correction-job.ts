import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { correctWritingTasksHeuristic } from "./heuristic-writing-correction";
import {
  correctWritingTasksWithGemini,
  isGeminiConfigured,
} from "./gemini-writing-correction";
import type {
  WritingCorrectionResult,
  WritingTaskInput,
} from "./writing-correction-types";

const MAX_ATTEMPTS = 4;

export async function enqueueWritingCorrectionJob(input: {
  seriesId: string;
  userId?: string | null;
  tasks: WritingTaskInput[];
  provisionalScore: Record<string, unknown>;
}): Promise<{ jobId: string; accessToken: string }> {
  const accessToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const job = await prisma.writingCorrectionJob.create({
    data: {
      seriesId: input.seriesId,
      userId: input.userId ?? null,
      accessToken,
      tasksPayload: input.tasks as unknown as Prisma.InputJsonValue,
      provisionalScore: input.provisionalScore as Prisma.InputJsonValue,
      expiresAt,
    },
  });

  return { jobId: job.id, accessToken };
}

export async function processWritingCorrectionJob(jobId: string): Promise<void> {
  const claimed = await prisma.writingCorrectionJob.updateMany({
    where: {
      id: jobId,
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: MAX_ATTEMPTS },
    },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
    },
  });

  if (claimed.count === 0) return;

  const job = await prisma.writingCorrectionJob.findUnique({
    where: { id: jobId },
  });

  if (!job) return;

  const tasks = job.tasksPayload as unknown as WritingTaskInput[];
  let result: WritingCorrectionResult;
  let resultSource: string;

  try {
    if (isGeminiConfigured()) {
      result = await correctWritingTasksWithGemini(tasks);
      resultSource = "gemini";
    } else {
      result = correctWritingTasksHeuristic(tasks);
      resultSource = "heuristic";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    try {
      result = correctWritingTasksHeuristic(tasks);
      resultSource = "heuristic";
    } catch {
      await prisma.writingCorrectionJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          lastError: message,
        },
      });
      return;
    }
  }

  await prisma.writingCorrectionJob.update({
    where: { id: jobId },
    data: {
      status: "COMPLETED",
      result: result as unknown as Prisma.InputJsonValue,
      resultSource,
      completedAt: new Date(),
      lastError: null,
    },
  });
}

export async function getWritingCorrectionByToken(
  accessToken: string
): Promise<{
  status: string;
  result: WritingCorrectionResult | null;
  resultSource: string | null;
} | null> {
  const job = await prisma.writingCorrectionJob.findUnique({
    where: { accessToken },
  });

  if (!job || job.expiresAt < new Date()) return null;

  return {
    status: job.status,
    result: (job.result as unknown as WritingCorrectionResult | null) ?? null,
    resultSource: job.resultSource,
  };
}
