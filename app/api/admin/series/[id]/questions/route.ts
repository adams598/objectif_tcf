import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/session";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";

const choiceSchema = z.object({
  content: z.string().min(1),
  isCorrect: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

const questionSchema = z.object({
  type: z.enum([
    "QCM",
    "TRUE_FALSE",
    "TEXT_INPUT",
    "AUDIO",
    "WRITING_TASK",
    "SPEAKING_TASK",
  ]),
  content: z.string().min(1),
  instruction: z.string().optional().nullable(),
  explanation: z.string().optional().nullable(),
  order: z.number().int().min(1),
  points: z.number().int().min(1).default(1),
  audioUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  choices: z.array(choiceSchema).optional(),
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");
    const { id: seriesId } = await params;

    const series = await prisma.examSeries.findFirst({
      where: { id: seriesId, deletedAt: null },
    });
    if (!series) return notFoundResponse("Série introuvable");

    const parsed = questionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { choices, ...questionData } = parsed.data;

    if (questionData.type === "QCM" && (!choices || choices.length < 2)) {
      return validationErrorResponse({
        choices: ["Au moins 2 choix requis pour un QCM"],
      });
    }

    if (questionData.type === "QCM") {
      const correctCount = choices!.filter((c) => c.isCorrect).length;
      if (correctCount !== 1) {
        return validationErrorResponse({
          choices: ["Exactement une réponse correcte requise"],
        });
      }
    }

    const question = await prisma.question.create({
      data: {
        ...questionData,
        seriesId,
        choices: choices
          ? { create: choices }
          : undefined,
      },
      include: { choices: true },
    });

    await prisma.examSeries.update({
      where: { id: seriesId },
      data: { totalPoints: { increment: questionData.points } },
    });

    return createdResponse(question);
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
