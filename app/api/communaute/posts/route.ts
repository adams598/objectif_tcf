import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import {
  successResponse,
  createdResponse,
  serverErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  tags: z.array(z.string()).default(["TCF Canada"]),
});

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(20).default(10),
  tag: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const { page, limit, tag } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(tag && tag !== "Tout" ? { tags: { has: tag } } : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          _count: { select: { likes: true, comments: true } },
          likes: {
            where: { userId: user.userId },
            select: { id: true },
            take: 1,
          },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    const mapped = posts.map(({ likes, ...post }) => ({
      ...post,
      likedByMe: likes.length > 0,
    }));

    return successResponse({
      posts: mapped,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return serverErrorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const post = await prisma.communityPost.create({
      data: {
        authorId: user.userId,
        content: parsed.data.content,
        tags: parsed.data.tags,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    return createdResponse({ ...post, likedByMe: false });
  } catch (error) {
    return serverErrorResponse(error);
  }
}
