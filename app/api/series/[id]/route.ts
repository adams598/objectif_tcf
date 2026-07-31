import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { canAccessSeries } from "@/lib/subscriptions/access";
import {
  successResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const series = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          include: {
            choices: {
              select: {
                id: true,
                content: true,
                order: true,
                // isCorrect volontairement omis — réservé au scoring serveur
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
        exam: { select: { title: true, type: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!series) return notFoundResponse("Série introuvable");

    const allowed = await canAccessSeries(
      user.userId,
      { isFree: series.isFree, exam: series.exam },
      user.role
    );

    if (!allowed) {
      return forbiddenResponse();
    }

    return successResponse(series);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
