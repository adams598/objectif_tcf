import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
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
  errorResponse,
} from "@/lib/utils/api-response";

const createCorrectorSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
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

export async function GET(_req: NextRequest) {
  try {
    await requireRole("ADMIN", "SUPER_ADMIN");

    const correctors = await prisma.user.findMany({
      where: { role: "CORRECTOR", deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            corrections: true,
          },
        },
      },
    });

    const pendingCount = await prisma.answer.count({
      where: {
        OR: [{ textResponse: { not: null } }, { audioUrl: { not: null } }],
        correction: null,
        attempt: {
          status: "COMPLETED",
          series: { skill: { in: ["EXPRESSION_ECRITE", "EXPRESSION_ORALE"] } },
        },
      },
    });

    return successResponse({ correctors, pendingCount });
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN", "SUPER_ADMIN");
    const body = await req.json();
    const parsed = createCorrectorSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    if (existing) {
      if (existing.deletedAt) {
        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            role: "CORRECTOR",
            isActive: true,
            deletedAt: null,
            firstName: parsed.data.firstName,
            lastName: parsed.data.lastName,
            name: `${parsed.data.firstName} ${parsed.data.lastName}`,
            emailVerified: true,
          },
        });
        return createdResponse(user, "Correcteur réactivé");
      }
      return errorResponse("Un compte existe déjà avec cet email", 409);
    }

    const rounds = parseInt(process.env.BCRYPT_ROUNDS ?? "12", 10);
    const hashedPassword = await bcrypt.hash(parsed.data.password, rounds);

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        name: `${parsed.data.firstName} ${parsed.data.lastName}`,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        role: "CORRECTOR",
        emailVerified: true,
        isActive: true,
        settings: { create: {} },
        accounts: {
          create: {
            provider: "credentials",
            providerAccountId: parsed.data.email.toLowerCase(),
            accessToken: hashedPassword,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.userId,
        action: "ADMIN_CREATE_CORRECTOR",
        entity: "User",
        entityId: user.id,
      },
    });

    return createdResponse(user, "Correcteur créé");
  } catch (error) {
    return handleAuthError(error) ?? serverErrorResponse(error);
  }
}
