import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/utils/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const series = await prisma.examSeries.findFirst({
      where: { id, deletedAt: null },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: "asc" },
        },
        exam: { select: { title: true, type: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!series) return notFoundResponse("Série introuvable");

    return successResponse(series);
  } catch (error) {
    return serverErrorResponse(error);
  }
}
