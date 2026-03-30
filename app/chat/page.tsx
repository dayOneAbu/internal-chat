import { redirect } from "next/navigation";

import { openDirectSessionAction, sendMessageAction } from "@/app/chat/actions";
import { signOutAction } from "@/app/auth/actions";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { upsertSupabaseUser } from "@/lib/auth/upsert-user";
import { getDirectSessionKey } from "@/lib/chat";
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

  const [users, sessions] = await Promise.all([
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

  const sessionByDirectKey = new Map(
    sessions
      .filter((session) => session.directKey)
      .map((session) => [session.directKey as string, session])
  );

  const resolvedSelectedSessionId =
    typeof params.session === "string" ? params.session : sessions[0]?.id;

  const selectedSession = resolvedSelectedSessionId
    ? await prisma.session.findFirst({
        where: {
          id: resolvedSelectedSessionId,
          participants: {
            some: {
              userId: appUser.id,
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

  const selectedPeer =
    selectedSession?.participants.find(
      (participant) => participant.userId !== appUser.id
    )?.user ?? null;

  const conversations = users.map((chatUser, index) => {
    const directKey = getDirectSessionKey(appUser.id, chatUser.id);
    const existingSession = sessionByDirectKey.get(directKey);
    const latestMessage = existingSession?.messages[0] ?? null;

    return {
      id: chatUser.id,
      name: chatUser.name,
      email: chatUser.email,
      avatarUrl: chatUser.avatarUrl,
      isAi: chatUser.isAi,
      latestMessage: latestMessage?.content ?? null,
      latestAt:
        latestMessage?.createdAt?.toISOString() ??
        existingSession?.updatedAt.toISOString() ??
        null,
      isSelected: selectedPeer?.id === chatUser.id,
      isOnline: index < 2 || chatUser.isAi,
      isUnread: index === 0 && selectedPeer?.id !== chatUser.id,
    };
  });

  const selectedConversation =
    selectedSession && selectedPeer
      ? {
          sessionId: selectedSession.id,
          peer: {
            id: selectedPeer.id,
            name: selectedPeer.name,
            email: selectedPeer.email,
            avatarUrl: selectedPeer.avatarUrl,
            isAi: selectedPeer.isAi,
            isOnline: true,
          },
          messages: selectedSession.messages.map((message) => ({
            id: message.id,
            senderId: message.senderId,
            senderName: message.sender.name,
            senderEmail: message.sender.email,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            isAi: message.isAi,
          })),
        }
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
      conversations={conversations}
      selectedConversation={selectedConversation}
      openDirectSessionAction={openDirectSessionAction}
      sendMessageAction={sendMessageAction}
      signOutAction={signOutAction}
    />
  );
}
