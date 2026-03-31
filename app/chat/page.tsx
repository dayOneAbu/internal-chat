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
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ChatPageProps = {
  searchParams: Promise<{
    session?: string;
  }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const params = await searchParams;
  const resolvedSelectedSessionId = params.session;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // 1. Get current user and ensure they exist (optimized)
  const appUser = await upsertSupabaseUser(user);
  
  // 2. Fetch everything in parallel
  const [contacts, sessions, selectedSession] = await Promise.all([
    prisma.user.findMany({
      where: { id: { not: appUser.id } },
      orderBy: [{ isAi: "desc" }, { name: "asc" }, { createdAt: "asc" }],
      take: 50,
    }),
    prisma.session.findMany({
      where: {
        participants: {
          some: { userId: appUser.id, isArchived: false },
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, senderId: true, content: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    resolvedSelectedSessionId
      ? prisma.session.findFirst({
        where: {
          id: resolvedSelectedSessionId,
          participants: { some: { userId: appUser.id, isArchived: false } },
        },
        include: {
          participants: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: { assets: true, sender: true },
          },
        },
      })
      : Promise.resolve(null),
    ensureShipAssistUser(),
  ]);

  if (!resolvedSelectedSessionId && sessions.length > 0) {
    redirect(`/chat?session=${sessions[0].id}`);
  }

  const selectedParticipant =
    selectedSession?.participants.find((p) => p.userId === appUser.id) ?? null;
  const selectedPeerParticipant =
    selectedSession?.participants.find((p) => p.userId !== appUser.id) ?? null;
  const selectedPeer = selectedPeerParticipant?.user ?? null;

  const latestVisibleSelectedMessage =
    selectedSession && selectedParticipant
      ? [...selectedSession.messages]
        .reverse()
        .find((message) => {
          if (!selectedParticipant.clearedAt) return true;
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

  // Note: markRead is now triggered via useEffect in ChatWorkspace or handled asynchronously
  // We avoid blocking here for performance.

  const conversations = sessions
    .flatMap((session) => {
      const currentParticipant = session.participants.find((p) => p.userId === appUser.id);
      const peerParticipant = session.participants.find((p) => p.userId !== appUser.id);

      if (!currentParticipant || !peerParticipant) return [];

      const latestVisibleMessage = session.messages[0] ?? null; // Since we took only 1

      const unreadCount = 0; // Simplified for sidebar speed, or fetch separately
      const isUnread = false; // We can improve this with a specific unread query if needed

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
          isSelected: resolvedSelectedSessionId === session.id,
          isOnline: peerParticipant.user.isAi,
          isUnread,
          unreadCount,
          isMuted: currentParticipant.isMuted,
        },
      ];
    })
    .sort((left, right) => {
      const leftTime = left.latestAt ? new Date(left.latestAt).getTime() : 0;
      const rightTime = right.latestAt ? new Date(right.latestAt).getTime() : 0;
      return rightTime - leftTime;
    });

  const selectedConversation =
    selectedSession && selectedPeer && selectedParticipant
      ? (() => {
        const visibleMessages = selectedSession.messages.filter((message) => {
          if (!selectedParticipant.clearedAt) return true;
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
          messages: visibleMessages.map((message) => {
            const messageAssets = mapAssetRecords(
              message.assets.map((asset) => ({
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
              sharedMedia: messageAssets.sharedMedia.flatMap((group) =>
                group.items.map((item) => ({
                  month: group.month,
                  tone: item.tone,
                  fileUrl: (item as any).fileUrl ?? null,
                  fileSize: (item as any).fileSize ?? null,
                  mimeType: (item as any).mimeType ?? null,
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
      contacts={contacts.map((contact) => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        avatarUrl: contact.avatarUrl,
        isAi: contact.isAi,
      }))}
      conversations={conversations as any}
      selectedConversation={selectedConversation as any}
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
