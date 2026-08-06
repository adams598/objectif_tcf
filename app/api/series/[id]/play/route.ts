import { NextRequest } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessSeries } from "@/lib/subscriptions/access";
import {
  enqueueWritingCorrectionJob,
  processWritingCorrectionJob,
} from "@/lib/ai/process-writing-correction-job";
import type { WritingTaskInput } from "@/lib/ai/writing-correction-types";
import {
  buildScoreResult,
  scoreOralTasks,
  scoreQcm,
  scoreWritingTasks,
  type ExamScoreResult,
  type SkillAbbrev,
} from "@/lib/examen/scoring";
import {
  persistExamSubmission,
  type PersistAnswerInput,
} from "@/lib/examen/persist-exam-submission";
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";
import {
  getPassageFromInstruction,
  parseQuestionMeta,
  getAudioScriptFromInstruction,
  getDocumentTypeFromInstruction,
  skillToAbbrev,
} from "@/lib/examen/content-bank/helpers";
import {
  getLearnerActivityStats,
  trackSeriesOpened,
} from "@/lib/examen/learner-activity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const series = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        exam: { select: { type: true, title: true } },
        questions: {
          where: { deletedAt: null },
          include: {
            choices: {
              orderBy: { order: "asc" },
              select: { id: true, content: true, order: true },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!series) return notFoundResponse("Série introuvable");

    const allowed = await canAccessSeries(
      user?.userId,
      {
        isFree: series.isFree,
        exam: series.exam,
      },
      user?.role
    );

    if (!allowed) {
      return forbiddenResponse();
    }

    let activeAttempt: {
      id: string;
      currentOrder: number | null;
      elapsedSec: number | null;
      startedAt: string;
      updatedAt: string;
      answers: Record<string, string>;
      textResponses: Record<string, string>;
    } | null = null;

    if (user?.userId) {
      const attempt = await trackSeriesOpened(user.userId, id).catch((err) => {
        console.error("[play] trackSeriesOpened", err);
        return null;
      });

      if (attempt) {
        const detail = await prisma.attempt.findUnique({
          where: { id: attempt.id },
          select: {
            id: true,
            currentOrder: true,
            elapsedSec: true,
            startedAt: true,
            updatedAt: true,
            answers: {
              select: {
                questionId: true,
                choiceId: true,
                textResponse: true,
                audioUrl: true,
              },
            },
          },
        });

        if (detail) {
          const answers: Record<string, string> = {};
          const textResponses: Record<string, string> = {};
          for (const a of detail.answers) {
            if (a.choiceId) answers[a.questionId] = a.choiceId;
            if (a.textResponse && !a.audioUrl) {
              textResponses[a.questionId] = a.textResponse;
            }
          }
          activeAttempt = {
            id: detail.id,
            currentOrder: detail.currentOrder,
            elapsedSec: detail.elapsedSec,
            startedAt: detail.startedAt.toISOString(),
            updatedAt: detail.updatedAt.toISOString(),
            answers,
            textResponses,
          };
        }
      }
    }

    return successResponse({
      id: series.id,
      title: series.title,
      skill: skillToAbbrev(series.skill),
      skillRaw: series.skill,
      durationMin: series.durationMin,
      order: series.order,
      examType: series.exam.type,
      examTitle: series.exam.title,
      questionCount: series.questions.length,
      questions: series.questions.map((q) => ({
        id: q.id,
        order: q.order,
        type: q.type,
        content: q.content,
        instruction: q.instruction,
        passage: getPassageFromInstruction(q.instruction),
        meta: parseQuestionMeta(q.instruction),
        audioScript: getAudioScriptFromInstruction(q.instruction),
        documentType: getDocumentTypeFromInstruction(q.instruction),
        audioUrl: q.audioUrl,
        videoUrl: q.videoUrl,
        imageUrl: q.imageUrl,
        choices: q.choices,
      })),
      activeAttempt,
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

const submitSchema = z.object({
  guestMode: z.boolean().optional(),
  examTab: z.string().optional(),
  durationSeconds: z.number().int().min(0),
  answers: z.record(z.string()).optional(),
  textResponses: z.record(z.string()).optional(),
  oralRecordings: z.record(z.string()).optional(),
  tasksCompleted: z.number().int().optional(),
  correctionMode: z.enum(["instant", "human"]).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const parsed = submitSchema.safeParse(await req.json());

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const series = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null, isPublished: true },
      include: {
        exam: { select: { type: true } },
        questions: {
          where: { deletedAt: null },
          include: { choices: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!series) return notFoundResponse("Série introuvable");

    const allowed = await canAccessSeries(
      user?.userId,
      {
        isFree: series.isFree,
        exam: series.exam,
      },
      user?.role
    );

    if (!allowed) {
      return forbiddenResponse();
    }

    const skillMap: Record<string, SkillAbbrev> = {
      COMPREHENSION_ORALE: "CO",
      COMPREHENSION_ECRITE: "CE",
      EXPRESSION_ECRITE: "EE",
      EXPRESSION_ORALE: "EO",
    };
    const skill = skillMap[series.skill] ?? "CO";
    const answers = parsed.data.answers ?? {};
    const textResponses = parsed.data.textResponses ?? {};
    const oralRecordings = parsed.data.oralRecordings ?? {};

    let correctCount = 0;
    let totalQuestions = series.questions.length;
    let percentage = 0;
    let details: Record<string, unknown> = {};

    if (skill === "CO" || skill === "CE") {
      const qcmData = series.questions.map((q) => ({
        id: q.id,
        correctChoiceId: q.choices.find((c) => c.isCorrect)?.id ?? "",
      }));
      const scored = scoreQcm(qcmData, answers);
      correctCount = scored.correct;
      totalQuestions = scored.total;
      percentage = scored.percentage;

      const answerReview = series.questions.map((q) => {
        const correctChoice = q.choices.find((c) => c.isCorrect);
        const selectedId = answers[q.id];
        const selected = q.choices.find((c) => c.id === selectedId);
        return {
          questionId: q.id,
          order: q.order,
          question: q.content,
          yourAnswer: selected?.content ?? null,
          correctAnswer: correctChoice?.content ?? "—",
          isCorrect: Boolean(selectedId && selectedId === correctChoice?.id),
        };
      });
      details = { answerReview };
    } else if (skill === "EE") {
      const tasks = series.questions.map((q) => {
        const meta = parseQuestionMeta(q.instruction) as {
          minWords?: number;
          maxWords?: number;
        };
        return {
          id: q.order,
          questionId: q.id,
          minWords: meta.minWords ?? 60,
          maxWords: meta.maxWords ?? 120,
          prompt: q.content,
        };
      });
      const contents: Record<number, string> = {};
      series.questions.forEach((q) => {
        contents[q.order] = textResponses[q.id] ?? "";
      });
      const scored = scoreWritingTasks(
        tasks.map(({ id: taskId, minWords, maxWords }) => ({
          id: taskId,
          minWords,
          maxWords,
        })),
        contents
      );
      correctCount = scored.correctCount;
      totalQuestions = scored.total;
      percentage = scored.percentage;
      details = { taskScores: scored.taskScores };

      const writingTasks: WritingTaskInput[] = tasks.map((t) => ({
        taskId: t.id,
        questionId: t.questionId,
        prompt: t.prompt,
        minWords: t.minWords,
        maxWords: t.maxWords,
        text: contents[t.id] ?? "",
      }));

      const provisionalScore = {
        percentage,
        correctCount,
        totalQuestions,
        taskScores: scored.taskScores,
      };

      const { jobId, accessToken } = await enqueueWritingCorrectionJob({
        seriesId: id,
        userId: user?.userId,
        tasks: writingTasks,
        provisionalScore,
      });

      details = {
        ...details,
        correctionToken: accessToken,
        correctionStatus: "pending",
      };

      after(async () => {
        try {
          await processWritingCorrectionJob(jobId);
        } catch (err) {
          console.error("Writing correction job failed:", err);
        }
      });
    } else {
      const completed = parsed.data.tasksCompleted ?? 0;
      const mode = parsed.data.correctionMode ?? "instant";
      const scored = scoreOralTasks(totalQuestions, completed, mode);
      correctCount = scored.correctCount;
      percentage = scored.percentage;
      details = { tasksCompleted: completed, correctionMode: mode };
    }

    let result = buildScoreResult({
      skill,
      seriesId: id,
      examTab: parsed.data.examTab,
      guestMode: parsed.data.guestMode ?? !user,
      correctCount,
      totalQuestions,
      percentage,
      durationSeconds: parsed.data.durationSeconds,
      details: details as ExamScoreResult["details"],
    });

    if (user?.userId && !parsed.data.guestMode) {
      const skillToPrisma: Record<SkillAbbrev, import("@prisma/client").Skill> = {
        CO: "COMPREHENSION_ORALE",
        CE: "COMPREHENSION_ECRITE",
        EE: "EXPRESSION_ECRITE",
        EO: "EXPRESSION_ORALE",
      };

      const prismaSkill = skillToPrisma[skill];
      const humanCorrectionRequested =
        skill === "EO" && parsed.data.correctionMode === "human";

      const persistAnswers: PersistAnswerInput[] = [];

      if (skill === "CO" || skill === "CE") {
        for (const q of series.questions) {
          const selectedChoiceId = answers[q.id];
          const correctChoice = q.choices.find((c) => c.isCorrect);
          persistAnswers.push({
            questionId: q.id,
            choiceId: selectedChoiceId,
            isCorrect: selectedChoiceId === correctChoice?.id,
          });
        }
      } else if (skill === "EE") {
        for (const q of series.questions) {
          const text = textResponses[q.id] ?? "";
          if (text.trim()) {
            persistAnswers.push({
              questionId: q.id,
              textResponse: text,
            });
          }
        }
      } else if (skill === "EO") {
        for (const q of series.questions) {
          const audioUrl = oralRecordings[q.id];
          if (humanCorrectionRequested || audioUrl) {
            persistAnswers.push({
              questionId: q.id,
              audioUrl: audioUrl || undefined,
              textResponse: audioUrl
                ? `[Tâche ${q.order}] Enregistrement oral soumis.\n\nConsigne : ${q.content}`
                : `[Tâche ${q.order}] Production orale soumise — en attente de correction humaine.\n\nConsigne : ${q.content}`,
            });
          }
        }
      }

      const attempt = await persistExamSubmission({
        userId: user.userId,
        seriesId: id,
        skill: prismaSkill,
        correctCount: result.correctCount,
        totalQuestions: result.totalQuestions,
        percentage: result.percentage,
        nclcLevel: result.nclcLevel,
        durationSeconds: result.durationSeconds,
        cecrLevel: result.cecrLevel,
        answers: persistAnswers.length > 0 ? persistAnswers : undefined,
        humanCorrectionRequested,
      });

      const activityStats = await getLearnerActivityStats(user.userId);
      result = {
        ...result,
        attemptId: attempt.id,
        details: {
          ...result.details,
          activityStats,
        },
      };
    }

    return successResponse(result);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
