import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  serverErrorResponse,
  unauthorizedResponse,
} from "@/lib/utils/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const search = new URL(req.url).searchParams.get("search")?.trim();

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    const roleFilter =
      currentUser?.role === "CORRECTOR"
        ? { role: "USER" as const }
        : currentUser?.role === "USER"
          ? { role: { in: ["CORRECTOR" as const, "ADMIN" as const] } }
          : { role: { in: ["USER" as const, "CORRECTOR" as const] } };

    const contacts = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        id: { not: user.userId },
        ...roleFilter,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      take: 30,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        role: true,
        email: true,
      },
    });

    return successResponse({ contacts });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return unauthorizedResponse();
    }
    return serverErrorResponse(error);
  }
}
