import { PrismaClient } from "@prisma/client";
import { ANALYTICS_DEMO_EMAIL_PREFIX } from "../lib/admin/real-users";

/**
 * Supprime les faux utilisateurs (et leurs paiements / tentatives) créés par
 * l’ancien seed analytics. Les stats admin ne doivent refléter que la base réelle.
 */
export async function cleanupAnalyticsDemoUsers(prisma: PrismaClient) {
  const demoUsers = await prisma.user.findMany({
    where: { email: { startsWith: ANALYTICS_DEMO_EMAIL_PREFIX } },
    select: { id: true },
  });

  if (demoUsers.length === 0) {
    console.log("Aucune donnée analytics démo à supprimer.");
    return 0;
  }

  const userIds = demoUsers.map((u) => u.id);

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { userId: { in: userIds } } });

    await tx.correction.deleteMany({
      where: {
        OR: [
          { studentId: { in: userIds } },
          { correctorId: { in: userIds } },
          { answer: { userId: { in: userIds } } },
        ],
      },
    });

    await tx.answer.deleteMany({ where: { userId: { in: userIds } } });

    const postIds = (
      await tx.communityPost.findMany({
        where: { authorId: { in: userIds } },
        select: { id: true },
      })
    ).map((p) => p.id);

    if (postIds.length > 0) {
      await tx.communityLike.deleteMany({ where: { postId: { in: postIds } } });
      await tx.communityComment.deleteMany({ where: { postId: { in: postIds } } });
      await tx.communityPost.deleteMany({ where: { id: { in: postIds } } });
    }

    await tx.communityLike.deleteMany({ where: { userId: { in: userIds } } });
    await tx.communityComment.deleteMany({
      where: { authorId: { in: userIds } },
    });

    await tx.message.deleteMany({
      where: {
        OR: [{ senderId: { in: userIds } }, { receiverId: { in: userIds } }],
      },
    });

    await tx.auditLog.deleteMany({ where: { userId: { in: userIds } } });

    const deleted = await tx.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(
      `${deleted.count} utilisateurs démo analytics supprimés (paiements et tentatives inclus).`
    );
  });

  return demoUsers.length;
}
