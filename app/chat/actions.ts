"use server";

import { redirect } from "next/navigation";

import { findOrCreateDirectSession } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getChatRedirectPath(formData: FormData, sessionId?: string | null) {
  const requestedPath = getString(formData, "redirectTo");

  if (requestedPath.startsWith("/chat")) {
    return requestedPath;
  }

  return sessionId ? `/chat?session=${sessionId}` : "/chat";
}

async function requireCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user.id;
}

async function requireCurrentParticipant(sessionId: string, currentUserId: string) {
  const participant = await prisma.sessionParticipant.findUnique({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
  });

  if (!participant) {
    redirect("/chat");
  }

  return participant;
}

export async function openDirectSessionAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const targetUserId = getString(formData, "targetUserId");

  if (!targetUserId || targetUserId === currentUserId) {
    redirect("/chat");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    redirect("/chat");
  }

  const session = await findOrCreateDirectSession(currentUserId, targetUserId);
  redirect(`/chat?session=${session.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");
  const content = getString(formData, "content");

  if (!sessionId || !content) {
    redirect(sessionId ? `/chat?session=${sessionId}` : "/chat");
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        sessionId,
        senderId: currentUserId,
        content,
      },
    }),
    prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
    prisma.sessionParticipant.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: currentUserId,
        },
      },
      data: {
        isArchived: false,
        clearedAt: null,
        lastReadAt: new Date(),
      },
    }),
  ]);

  redirect(`/chat?session=${sessionId}`);
}

export async function archiveConversationAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");

  if (!sessionId) {
    redirect("/chat");
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
    data: {
      isArchived: true,
    },
  });

  redirect("/chat");
}

export async function markConversationUnreadAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");

  if (!sessionId) {
    redirect("/chat");
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
    data: {
      lastReadAt: null,
    },
  });

  redirect(getChatRedirectPath(formData, sessionId));
}

export async function toggleMuteConversationAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");

  if (!sessionId) {
    redirect("/chat");
  }

  const participant = await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
    data: {
      isMuted: !participant.isMuted,
    },
  });

  redirect(getChatRedirectPath(formData, sessionId));
}

export async function clearConversationAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");

  if (!sessionId) {
    redirect("/chat");
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
    data: {
      clearedAt: new Date(),
      lastReadAt: new Date(),
    },
  });

  redirect("/chat");
}

export async function deleteConversationAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");

  if (!sessionId) {
    redirect("/chat");
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  await prisma.$transaction(async (tx) => {
    await tx.sessionParticipant.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId: currentUserId,
        },
      },
    });

    const remainingParticipants = await tx.sessionParticipant.count({
      where: {
        sessionId,
      },
    });

    if (remainingParticipants === 0) {
      await tx.session.delete({
        where: {
          id: sessionId,
        },
      });
    }
  });

  redirect("/chat");
}
