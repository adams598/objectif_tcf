import type { PrismaClient } from "@prisma/client";

/** Retire abonnements actifs + sessions. */
export async function revokeUserAccess(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await prisma.subscription.updateMany({
    where: { userId },
    data: {
      status: "CANCELLED",
      autoRenew: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: new Date(),
    },
  });
  await prisma.session.updateMany({
    where: { userId },
    data: { isRevoked: true },
  });
}

/**
 * Soft-archive : plus d'accès, reste en BDD, hors listes admin (`deletedAt`).
 */
export async function archiveUser(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await revokeUserAccess(prisma, userId);
  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      isActive: false,
      adminPasswordEnc: null,
    },
  });
}

/**
 * Hard-delete : retire les accès puis efface le compte et les relations
 * qui n'ont pas `onDelete: Cascade` (sinon Postgres renvoie 500).
 */
export async function permanentlyDeleteUser(
  prisma: PrismaClient,
  userId: string
): Promise<void> {
  await revokeUserAccess(prisma, userId);

  await prisma.$transaction(async (tx) => {
    // Messagerie
    await tx.message.deleteMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    });

    // Communauté
    await tx.communityLike.deleteMany({ where: { userId } });
    await tx.communityComment.deleteMany({ where: { authorId: userId } });
    await tx.communityPost.deleteMany({ where: { authorId: userId } });

    // Corrections (pas de Cascade sur student / corrector / answer)
    await tx.correction.updateMany({
      where: { correctorId: userId },
      data: { correctorId: null },
    });
    await tx.correction.deleteMany({
      where: {
        OR: [{ studentId: userId }, { answer: { userId } }],
      },
    });

    // Answers référencent User sans Cascade — supprimer avant le user
    await tx.answer.deleteMany({ where: { userId } });

    // Audit logs où l'utilisateur est l'acteur
    await tx.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    });

    // Le reste (sessions, accounts, attempts, payments, subscriptions…)
    // est en Cascade / SetNull côté schéma.
    await tx.user.delete({ where: { id: userId } });
  });
}
