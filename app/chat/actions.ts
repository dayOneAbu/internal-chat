"use server";

import { redirect } from "next/navigation";

import { findOrCreateDirectSession } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function extractSharedLinks(content: string) {
  const matches = content.match(/https?:\/\/[^\s]+/g) ?? [];

  return matches.map((url) => ({
    url,
    title: url,
    description: "Shared from the conversation thread.",
    accent: "bg-slate-900 text-white",
  }));
}

function extractSharedDocs(content: string) {
  const matches =
    content.match(/\b[\w-]+\.(pdf|docx|fig|ai|png|jpg|jpeg)\b/gi) ?? [];

  return matches.map((name) => {
    const extension = name.split(".").pop()?.toUpperCase() ?? "FILE";

    return {
      name,
      meta: `Shared in chat • ${extension.toLowerCase()}`,
      tone:
        extension === "PDF"
          ? "bg-red-50 text-red-500"
          : extension === "FIG"
            ? "bg-violet-50 text-violet-500"
            : extension === "AI"
              ? "bg-orange-50 text-orange-500"
              : "bg-slate-100 text-slate-500",
      short: extension,
    };
  });
}

function extractSharedMedia(content: string) {
  const hasMediaHint = /\b(image|photo|screenshot|mockup|artwork|design)\b/i.test(
    content
  );

  if (!hasMediaHint) {
    return [];
  }

  return [
    {
      month: new Intl.DateTimeFormat("en-US", { month: "long" }).format(
        new Date()
      ),
      tone: "from-fuchsia-500 via-violet-500 to-cyan-300",
    },
  ];
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
        sharedLinks: extractSharedLinks(content),
        sharedDocs: extractSharedDocs(content),
        sharedMedia: extractSharedMedia(content),
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
