import { redirect } from "next/navigation";

import {
  archiveConversationAction,
  clearConversationAction,
  deleteConversationAction,
  markConversationUnreadAction,
  openDirectSessionAction,
  sendMessageAction,
  toggleMuteConversationAction,
} from "@/app/chat/actions";
import { signOutAction } from "@/app/auth/actions";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import {
  parseSharedDocs,
  parseSharedLinks,
  parseSharedMedia,
} from "@/lib/chat-shared-assets";
import { upsertSupabaseUser } from "@/lib/auth/upsert-user";
import { extractConversationSharedAssets } from "@/lib/chat-shared-assets";
import { prisma } from "@/lib/prisma";
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
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    }),
  ]);

  const resolvedSelectedSessionId =
    typeof params.session === "string" ? params.session : sessions[0]?.id;

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
              sender: true,
            },
          },
        },
      })
    : null;

  const selectedParticipant =
    selectedSession?.participants.find(
      (participant) => participant.userId === appUser.id
    ) ?? null;
  const selectedPeer =
    selectedSession?.participants.find(
      (participant) => participant.userId !== appUser.id
    )?.user ?? null;

  const latestVisibleSelectedMessage =
    selectedSession && selectedParticipant
      ? [...selectedSession.messages]
          .reverse()
          .find((message) => {
            if (!selectedParticipant.clearedAt) {
              return true;
            }

            return message.createdAt > selectedParticipant.clearedAt;
          }) ?? null
      : null;

  if (
    selectedSession &&
    selectedParticipant &&
    latestVisibleSelectedMessage &&
    latestVisibleSelectedMessage.senderId !== appUser.id &&
    (!selectedParticipant.lastReadAt ||
      latestVisibleSelectedMessage.createdAt > selectedParticipant.lastReadAt)
  ) {
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

  const conversations = sessions.flatMap((session, index) => {
    const currentParticipant = session.participants.find(
      (participant) => participant.userId === appUser.id
    );
    const peerParticipant = session.participants.find(
      (participant) => participant.userId !== appUser.id
    );

    if (!currentParticipant || !peerParticipant) {
      return [];
    }

    const latestVisibleMessage =
      session.messages.find((message) => {
        if (!currentParticipant.clearedAt) {
          return true;
        }

        return message.createdAt > currentParticipant.clearedAt;
      }) ?? null;

    const isUnread = latestVisibleMessage
      ? latestVisibleMessage.senderId !== appUser.id &&
        (!currentParticipant.lastReadAt ||
          latestVisibleMessage.createdAt > currentParticipant.lastReadAt)
      : false;

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
        isOnline: index < 2 || peerParticipant.user.isAi,
        isUnread,
        isMuted: currentParticipant.isMuted,
      },
    ];
  });

  const selectedConversation =
    selectedSession && selectedPeer && selectedParticipant
      ? (() => {
          const visibleMessages = selectedSession.messages.filter((message) => {
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
            isOnline: true,
          },
          messages: visibleMessages.map((message) => ({
              id: message.id,
              senderId: message.senderId,
              senderName: message.sender.name,
              senderEmail: message.sender.email,
              content: message.content,
              createdAt: message.createdAt.toISOString(),
              isAi: message.isAi,
              sharedLinks: parseSharedLinks(message.sharedLinks),
              sharedDocs: parseSharedDocs(message.sharedDocs),
              sharedMedia: parseSharedMedia(message.sharedMedia),
            })),
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
      conversations={conversations}
      selectedConversation={selectedConversation}
      openDirectSessionAction={openDirectSessionAction}
      sendMessageAction={sendMessageAction}
      archiveConversationAction={archiveConversationAction}
      markConversationUnreadAction={markConversationUnreadAction}
      toggleMuteConversationAction={toggleMuteConversationAction}
      clearConversationAction={clearConversationAction}
      deleteConversationAction={deleteConversationAction}
      signOutAction={signOutAction}
    />
  );
}
