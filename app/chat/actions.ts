"use server";

import { redirect } from "next/navigation";

import {
  ensureShipAssistUser,
  generateAiReply,
  type ShipAssistMessage,
} from "@/lib/ai/ship-assist";
import {
  serializeChatUser,
  serializeRealtimeMessage,
} from "@/lib/realtime/events";
import {
  dedupeSharedDocs,
  dedupeSharedLinks,
  dedupeSharedMedia,
  parseSharedDocs,
  parseSharedLinks,
  parseSharedMedia,
  parseUploadedAssets,
} from "@/lib/chat-shared-assets";
import { findOrCreateAiSession, findOrCreateDirectSession } from "@/lib/chat";
import {
  MESSAGE_REACTION_EMOJIS,
  summarizeMessageReactions,
  toggleStoredMessageReaction,
  type MessageReactionSummary,
} from "@/lib/message-reactions";
import { prisma } from "@/lib/prisma";
import {
  broadcastMessageCreated,
  broadcastMessageReactionsUpdated,
  broadcastReadReceipt,
} from "@/lib/supabase/realtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getJsonField(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return [];
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return [];
  }
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

function buildMessageContent(
  content: string,
  counts: { links: number; docs: number; media: number }
) {
  if (content) {
    return content;
  }

  const summary = [
    counts.links > 0
      ? `${counts.links} ${counts.links === 1 ? "link" : "links"}`
      : null,
    counts.docs > 0
      ? `${counts.docs} ${counts.docs === 1 ? "document" : "documents"}`
      : null,
    counts.media > 0
      ? `${counts.media} ${counts.media === 1 ? "media item" : "media items"}`
      : null,
  ].filter(Boolean);

  return summary.length > 0
    ? `Shared ${summary.join(", ")}.`
    : "Shared an update.";
}

function buildAssetCreates(payload: {
  sharedLinks: ReturnType<typeof dedupeSharedLinks>;
  sharedDocs: ReturnType<typeof dedupeSharedDocs>;
  sharedMedia: ReturnType<typeof dedupeSharedMedia>;
  uploadedAssets: ReturnType<typeof parseUploadedAssets>;
}) {
  return [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...payload.sharedLinks.map((item: any) => ({
      kind: "link" as const,
      url: item.url,
      title: item.title ?? undefined,
      description: item.description ?? undefined,
      accent: item.accent ?? undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...payload.sharedDocs.map((item: any) => ({
      kind: "doc" as const,
      name: item.name,
      meta: item.meta,
      short: item.short ?? undefined,
      tone: item.tone ?? undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...payload.sharedMedia.map((item: any) => ({
      kind: "media" as const,
      month: item.month,
      tone: item.tone,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...payload.uploadedAssets.map((item: any) => ({
      kind: item.kind,
      fileUrl: item.fileUrl,
      fileSize: item.fileSize ?? undefined,
      mimeType: item.mimeType ?? undefined,
      name: item.name ?? undefined,
      month:
        item.kind === "media"
          ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(
              new Date()
            )
          : undefined,
      tone:
        item.kind === "media"
          ? "from-slate-700 via-slate-800 to-black"
          : undefined,
      meta:
        item.kind === "doc"
          ? `Uploaded • ${item.fileSize ? Math.round(item.fileSize / 1024) + " KB" : "Unknown size"}`
          : undefined,
      short:
        item.kind === "doc" && item.name
          ? item.name.split(".").pop()?.toUpperCase()
          : undefined,
    })),
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

function buildConversationViewers(
  participants: Array<{
    userId: string;
    isMuted: boolean;
    isArchived: boolean;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
      isAi: boolean;
    };
  }>
) {
  return participants.flatMap((participant: { userId: string, isMuted: boolean, isArchived: boolean, user: { id: string, name: string | null, email: string | null, avatarUrl: string | null, isAi: boolean } }) => {
    const peer = participants.find(
      (candidate: { userId: string, user: { id: string } }) => candidate.userId !== participant.userId
    )?.user;

    if (!peer) {
      return [];
    }

    return [
      {
        userId: participant.userId,
        peer: serializeChatUser(peer),
        isMuted: participant.isMuted,
        isArchived: participant.isArchived,
      },
    ];
  });
}

async function replyAsAi(sessionId: string, currentUserId: string) {
  const participant = await requireCurrentParticipant(sessionId, currentUserId);
  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!session || session.kind !== "ai") {
    return;
  }

  const aiParticipant = session.participants.find((entry: { user: { isAi: boolean }, userId: string }) => entry.user.isAi);

  if (!aiParticipant || aiParticipant.userId === currentUserId) {
    return;
  }

  const recentMessages = await prisma.message.findMany({
    where: {
      sessionId,
      ...(participant.clearedAt
        ? {
            createdAt: {
              gt: participant.clearedAt,
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      sender: {
        select: {
          id: true,
          isAi: true,
        },
      },
    },
  });

  const orderedMessages = [...recentMessages].reverse();
  const latestMessage = orderedMessages[orderedMessages.length - 1];

  if (!latestMessage || latestMessage.senderId !== currentUserId) {
    return;
  }

  const transcript: ShipAssistMessage[] = orderedMessages.map((message: { senderId: string, content: string, sender: { isAi: boolean } }) => ({
    role:
      message.senderId === currentUserId
        ? "user"
        : message.sender.isAi
          ? "assistant"
          : "peer",
    content: message.content,
  }));
  const reply = await generateAiReply(transcript);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { message, participants } = await prisma.$transaction(async (tx: any) => {
    const message = await tx.message.create({
      data: {
        sessionId,
        senderId: aiParticipant.userId,
        isAi: true,
        content: reply,
      },
      include: {
        sender: true,
        assets: true,
      },
    });

    await tx.session.update({
      where: {
        id: sessionId,
      },
      data: {
        updatedAt: message.createdAt,
      },
    });

    await tx.sessionParticipant.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: aiParticipant.userId,
        },
      },
      data: {
        lastReadAt: message.createdAt,
      },
    });

    await tx.sessionParticipant.updateMany({
      where: {
        sessionId,
        userId: {
          not: aiParticipant.userId,
        },
      },
      data: {
        isArchived: false,
      },
    });

    const participants = await tx.sessionParticipant.findMany({
      where: {
        sessionId,
      },
      include: {
        user: true,
      },
    });

    return {
      message,
      participants,
    };
  });

  await broadcastMessageCreated({
    sessionId,
    message: serializeRealtimeMessage(message, currentUserId),
    viewers: buildConversationViewers(participants),
  });
}

export async function openDirectSessionAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const targetUserId = getString(formData, "targetUserId");

  if (!targetUserId || targetUserId === currentUserId) {
    redirect("/chat");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isAi: true },
  });

  if (!targetUser) {
    redirect("/chat");
  }

  if (targetUser.isAi) {
    await ensureShipAssistUser();
  }

  const session = targetUser.isAi
    ? await findOrCreateAiSession(currentUserId, targetUserId)
    : await findOrCreateDirectSession(currentUserId, targetUserId);
  redirect(`/chat?session=${session.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");
  const content = getString(formData, "content");
  const sharedLinks = dedupeSharedLinks([
    ...parseSharedLinks(getJsonField(formData, "sharedLinksJson")),
    ...extractSharedLinks(content),
  ]);
  const sharedDocs = dedupeSharedDocs([
    ...parseSharedDocs(getJsonField(formData, "sharedDocsJson")),
    ...extractSharedDocs(content),
  ]);
  const sharedMedia = dedupeSharedMedia([
    ...parseSharedMedia(getJsonField(formData, "sharedMediaJson")),
    ...extractSharedMedia(content),
  ]);
  const uploadedAssets = parseUploadedAssets(
    getJsonField(formData, "uploadedAssetsJson")
  );
  
  const resolvedContent = buildMessageContent(content, {
    links: sharedLinks.length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    docs: sharedDocs.length + uploadedAssets.filter((a: any) => a.kind === "doc").length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media: sharedMedia.length + uploadedAssets.filter((a: any) => a.kind === "media").length,
  });
  const assetCreates = buildAssetCreates({
    sharedLinks,
    sharedDocs,
    sharedMedia,
    uploadedAssets,
  });

  if (
    !sessionId ||
    (!content &&
      sharedLinks.length === 0 &&
      sharedDocs.length === 0 &&
      sharedMedia.length === 0 &&
      uploadedAssets.length === 0)
  ) {
    return;
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { message, participants } = await prisma.$transaction(async (tx: any) => {
    const message = await tx.message.create({
      data: {
        sessionId,
        senderId: currentUserId,
        content: resolvedContent,
        assets:
          assetCreates.length > 0
            ? {
                create: assetCreates,
              }
            : undefined,
      },
      include: {
        sender: true,
        assets: true,
      },
    });

    await tx.session.update({
      where: { id: sessionId },
      data: { updatedAt: message.createdAt },
    });

    await tx.sessionParticipant.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId: currentUserId,
        },
      },
      data: {
        isArchived: false,
        clearedAt: null,
        lastReadAt: message.createdAt,
      },
    });

    await tx.sessionParticipant.updateMany({
      where: {
        sessionId,
        userId: {
          not: currentUserId,
        },
      },
      data: {
        isArchived: false,
      },
    });

    const participants = await tx.sessionParticipant.findMany({
      where: {
        sessionId,
      },
      include: {
        user: true,
      },
    });

    return {
      message,
      participants,
    };
  });

  const realtimeMessage = serializeRealtimeMessage(message, currentUserId);
  const viewers = buildConversationViewers(participants);

  await broadcastMessageCreated({
    sessionId,
    message: realtimeMessage,
    viewers,
  });

  const aiParticipant = participants.find((participant: { user: { isAi: boolean }, userId: string }) => participant.user.isAi);

  if (aiParticipant) {
    await replyAsAi(sessionId, currentUserId);
  }
}

export async function toggleMessageReactionAction(messageId: string, emoji: string) {
  const currentUserId = await requireCurrentUserId();

  if (!messageId || !emoji) {
    return [] as MessageReactionSummary[];
  }

  if (!MESSAGE_REACTION_EMOJIS.includes(emoji as never)) {
    return [] as MessageReactionSummary[];
  }

  const message = await prisma.message.findUnique({
    where: {
      id: messageId,
    },
    select: {
      id: true,
      sessionId: true,
      reactions: true,
      session: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!message) {
    return [] as MessageReactionSummary[];
  }

  await requireCurrentParticipant(message.sessionId, currentUserId);

  const nextStoredReactions = toggleStoredMessageReaction(
    message.reactions,
    emoji,
    currentUserId
  );
  const updatedMessage = await prisma.message.update({
    where: {
      id: messageId,
    },
    data: {
      reactions: nextStoredReactions,
    },
    select: {
      sessionId: true,
      reactions: true,
    },
  });

  const summarized = summarizeMessageReactions(
    updatedMessage.reactions,
    currentUserId
  );

  await broadcastMessageReactionsUpdated({
    sessionId: updatedMessage.sessionId,
    messageId,
    reactions: nextStoredReactions,
  });

  return summarized;
}

export async function markReadAction(sessionId: string) {
  const currentUserId = await requireCurrentUserId();

  if (!sessionId) {
    return;
  }

  await requireCurrentParticipant(sessionId, currentUserId);

  const readAt = new Date();

  await prisma.sessionParticipant.update({
    where: {
      sessionId_userId: {
        sessionId,
        userId: currentUserId,
      },
    },
    data: {
      lastReadAt: readAt,
    },
  });

  await broadcastReadReceipt(sessionId, currentUserId, readAt.toISOString());
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.$transaction(async (tx: any) => {
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
