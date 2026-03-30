import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export function getDirectSessionKey(userAId: string, userBId: string) {
  return [userAId, userBId].sort().join("::");
}

export async function findOrCreateDirectSession(
  currentUserId: string,
  targetUserId: string
) {
  const directKey = getDirectSessionKey(currentUserId, targetUserId);

  const existingSession = await prisma.session.findUnique({
    where: { directKey },
  });

  if (existingSession) {
    await prisma.$transaction([
      prisma.sessionParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: existingSession.id,
            userId: currentUserId,
          },
        },
        update: {
          isArchived: false,
          lastReadAt: new Date(),
        },
        create: {
          sessionId: existingSession.id,
          userId: currentUserId,
          isArchived: false,
          lastReadAt: new Date(),
        },
      }),
      prisma.sessionParticipant.upsert({
        where: {
          sessionId_userId: {
            sessionId: existingSession.id,
            userId: targetUserId,
          },
        },
        update: {},
        create: {
          sessionId: existingSession.id,
          userId: targetUserId,
        },
      }),
    ]);

    return existingSession;
  }

  try {
    return await prisma.session.create({
      data: {
        kind: "direct",
        directKey,
        participants: {
          create: [
            { userId: currentUserId, lastReadAt: new Date() },
            { userId: targetUserId },
          ],
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raceWinner = await prisma.session.findUnique({
        where: { directKey },
      });

      if (raceWinner) {
        return raceWinner;
      }
    }

    throw error;
  }
}
