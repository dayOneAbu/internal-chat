import { redirect } from "next/navigation";

import {
  archiveConversationAction,
  clearConversationAction,
  deleteConversationAction,
  markConversationUnreadAction,
  markReadAction,
  openDirectSessionAction,
  sendMessageAction,
  toggleMessageReactionAction,
  toggleMuteConversationAction,
} from "@/app/chat/actions";
import { signOutAction } from "@/app/auth/actions";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { ensureShipAssistUser } from "@/lib/ai/ship-assist";
import { upsertSupabaseUser } from "@/lib/auth/upsert-user";
import {
  extractConversationSharedAssets,
  mapAssetRecords,
} from "@/lib/chat-shared-assets";
import { summarizeMessageReactions } from "@/lib/message-reactions";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChatPageProps = {
  searchParams: Promise<{
    session?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) {
    redirect("/auth");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const appUser = await upsertSupabaseUser(user);
  await ensureShipAssistUser();

  const [contacts, sessions] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: appUser.id },
      },
      orderBy: [{ isAi: "desc" }, { name: "asc" }, { createdAt: "asc" }],
    }),
    prisma.session.findMany({
      where: {
        participants: {
          some: {
            userId: appUser.id,
            isArchived: false,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const resolvedSelectedSessionId =
    typeof params.session === "string" ? params.session : undefined;

  if (!resolvedSelectedSessionId && sessions.length > 0) {
    redirect(`/chat?session=${sessions[0].id}`);
  }

  const selectedSession = resolvedSelectedSessionId
    ? await prisma.session.findFirst({
      where: {
        id: resolvedSelectedSessionId,
        participants: {
          some: {
            userId: appUser.id,
            isArchived: false,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            assets: true,
            sender: true,
          },
        },
      },
    })
    : null;

  const selectedParticipant =
    selectedSession?.participants.find(
      (participant: { userId: string }) => participant.userId === appUser.id
    ) ?? null;
  const selectedPeerParticipant =
    selectedSession?.participants.find(
      (participant: { userId: string, user: { id: string, name: string | null, email: string | null, avatarUrl: string | null, isAi: boolean } }) => participant.userId !== appUser.id
    ) ?? null;
  const selectedPeer =
    selectedPeerParticipant?.user ?? null;

  const latestVisibleSelectedMessage =
    selectedSession && selectedParticipant
      ? [...selectedSession.messages]
        .reverse()
        .find((message: { createdAt: Date }) => {
          if (!selectedParticipant.clearedAt) {
            return true;
          }

          return message.createdAt > selectedParticipant.clearedAt;
        }) ?? null
      : null;

  const selectedConversationMarkedRead =
    !!(
      selectedSession &&
      selectedParticipant &&
      latestVisibleSelectedMessage &&
      latestVisibleSelectedMessage.senderId !== appUser.id &&
      (!selectedParticipant.lastReadAt ||
        latestVisibleSelectedMessage.createdAt > selectedParticipant.lastReadAt)
    );

  if (selectedConversationMarkedRead) {
    await prisma.sessionParticipant.update({
      where: {
        sessionId_userId: {
          sessionId: selectedSession.id,
          userId: appUser.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });
  }

  const conversations = sessions
    .flatMap((session: { id: string, participants: { userId: string, isMuted: boolean, clearedAt: Date | null, lastReadAt: Date | null, user: { id: string, name: string | null, email: string | null, avatarUrl: string | null, isAi: boolean } }[], messages: { senderId: string, createdAt: Date, content: string | null }[] }) => {
      const currentParticipant = session.participants.find(
        (participant: { userId: string, isMuted: boolean, clearedAt: Date | null, lastReadAt: Date | null }) => participant.userId === appUser.id
      );
      const peerParticipant = session.participants.find(
        (participant: { userId: string, user: { id: string, name: string | null, email: string | null, avatarUrl: string | null, isAi: boolean } }) => participant.userId !== appUser.id
      );

      if (!currentParticipant || !peerParticipant) {
        return [];
      }

      const latestVisibleMessage =
        session.messages.find((message: { createdAt: Date, content: string | null }) => {
          if (!currentParticipant.clearedAt) {
            return true;
          }

          return message.createdAt > currentParticipant.clearedAt;
        }) ?? null;

      const unreadCount = session.messages.filter((message: { senderId: string, createdAt: Date }) => {
        if (message.senderId === appUser.id) {
          return false;
        }

        if (
          currentParticipant.clearedAt &&
          message.createdAt <= currentParticipant.clearedAt
        ) {
          return false;
        }

        if (
          session.id === selectedSession?.id &&
          selectedConversationMarkedRead
        ) {
          return false;
        }

        if (!currentParticipant.lastReadAt) {
          return true;
        }

        return message.createdAt > currentParticipant.lastReadAt;
      }).length;
      const isUnread = unreadCount > 0;

      return [
        {
          sessionId: session.id,
          id: peerParticipant.user.id,
          name: peerParticipant.user.name,
          email: peerParticipant.user.email,
          avatarUrl: peerParticipant.user.avatarUrl,
          isAi: peerParticipant.user.isAi,
          latestMessage: latestVisibleMessage?.content ?? null,
          latestAt: latestVisibleMessage?.createdAt.toISOString() ?? null,
          isSelected: selectedSession?.id === session.id,
          isOnline: peerParticipant.user.isAi,
          isUnread,
          unreadCount,
          isMuted: currentParticipant.isMuted,
        },
      ];
    })
    .sort((left: { latestAt: string | null }, right: { latestAt: string | null }) => {
      const leftTime = left.latestAt ? new Date(left.latestAt).getTime() : 0;
      const rightTime = right.latestAt ? new Date(right.latestAt).getTime() : 0;

      return rightTime - leftTime;
    });

  const selectedConversation =
    selectedSession && selectedPeer && selectedParticipant
      ? (() => {
        const visibleMessages = selectedSession.messages.filter((message: { createdAt: Date }) => {
          if (!selectedParticipant.clearedAt) {
            return true;
          }

          return message.createdAt > selectedParticipant.clearedAt;
        });

        const sharedAssets = extractConversationSharedAssets(visibleMessages);

        return {
          sessionId: selectedSession.id,
          peer: {
            id: selectedPeer.id,
            name: selectedPeer.name,
            email: selectedPeer.email,
            avatarUrl: selectedPeer.avatarUrl,
            isAi: selectedPeer.isAi,
            isOnline: selectedPeer.isAi,
          },
          peerLastReadAt: selectedPeerParticipant?.lastReadAt?.toISOString() ?? null,
          messages: visibleMessages.map((message: { id: string, senderId: string, sender: { name: string | null, email: string | null }, content: string, createdAt: Date, isAi: boolean, reactions: Prisma.JsonValue, assets: { kind: "link" | "doc" | "media", url: string | null, title: string | null, description: string | null, accent: string | null, name: string | null, meta: string | null, short: string | null, tone: string | null, month: string | null }[] }) => {
            const messageAssets = mapAssetRecords(
              message.assets.map((asset: { kind: "link" | "doc" | "media", url: string | null, title: string | null, description: string | null, accent: string | null, name: string | null, meta: string | null, short: string | null, tone: string | null, month: string | null }) => ({
                kind: asset.kind,
                url: asset.url,
                title: asset.title,
                description: asset.description,
                accent: asset.accent,
                name: asset.name,
                meta: asset.meta,
                short: asset.short,
                tone: asset.tone,
                month: asset.month,
              }))
            );

            return {
              id: message.id,
              senderId: message.senderId,
              senderName: message.sender.name,
              senderEmail: message.sender.email,
              content: message.content,
              createdAt: message.createdAt.toISOString(),
              isAi: message.isAi,
              isReadByPeer:
                message.senderId === appUser.id &&
                !!selectedPeerParticipant?.lastReadAt &&
                message.createdAt <= selectedPeerParticipant.lastReadAt,
              reactions: summarizeMessageReactions(message.reactions, appUser.id),
              sharedLinks: messageAssets.sharedLinks,
              sharedDocs: messageAssets.sharedDocs,
              sharedMedia: messageAssets.sharedMedia.flatMap((group: { month: string, items: { tone: string, fileUrl?: string | null, fileSize?: number | null, mimeType?: string | null }[] }) =>
                group.items.map((item: { tone: string, fileUrl?: string | null, fileSize?: number | null, mimeType?: string | null }) => ({
                  month: group.month,
                  tone: item.tone,
                  fileUrl: item.fileUrl ?? null,
                  fileSize: item.fileSize ?? null,
                  mimeType: item.mimeType ?? null,
                }))
              ),
            };
          }),
          sharedLinks: sharedAssets.sharedLinks,
          sharedDocs: sharedAssets.sharedDocs,
          sharedMedia: sharedAssets.sharedMedia,
        };
      })()
      : null;

  return (
    <ChatWorkspace
      currentUser={{
        id: appUser.id,
        name: appUser.name,
        email: appUser.email,
        avatarUrl: appUser.avatarUrl,
        isAi: appUser.isAi,
      }}
      contacts={contacts.map((contact: { id: string, name: string | null, email: string | null, avatarUrl: string | null, isAi: boolean }) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatarUrl: contact.avatarUrl,
        isAi: contact.isAi,
      }))}
      conversations={conversations}
      selectedConversation={selectedConversation}
      openDirectSessionAction={openDirectSessionAction}
      sendMessageAction={sendMessageAction}
      toggleMessageReactionAction={toggleMessageReactionAction}
      archiveConversationAction={archiveConversationAction}
      markConversationUnreadAction={markConversationUnreadAction}
      toggleMuteConversationAction={toggleMuteConversationAction}
      clearConversationAction={clearConversationAction}
      deleteConversationAction={deleteConversationAction}
      signOutAction={signOutAction}
      markReadAction={markReadAction}
    />
  );
}
