import "server-only";

import type { ChatUser } from "@/components/chat/chat-types";
import {
  getSessionChannelName,
  getTypingChannelName,
  getUserInboxChannelName,
} from "@/lib/realtime/channels";
import type {
  InboxMessageCreatedPayload,
  MessageReactionsUpdatedPayload,
  RealtimeMessagePayload,
  TypingUpdatedPayload,
  CallStartedPayload,
  CallEndedPayload,
} from "@/lib/realtime/events";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function sendPrivateBroadcast(topic: string, event: string, payload: unknown) {
  const supabase = createSupabaseAdminClient();
  const channel = supabase.channel(topic, {
    config: {
      private: true,
    },
  });

  try {
    const result = await channel.httpSend(event, payload);

    if (!result.success) {
      throw new Error(
        `Supabase broadcast failed with status: ${result.status} (${result.error})`
      );
    }
  } finally {
    await supabase.removeChannel(channel);
  }
}

export async function broadcastMessageCreated(params: {
  sessionId: string;
  message: RealtimeMessagePayload;
  viewers: Array<{
    userId: string;
    peer: ChatUser;
    isMuted: boolean;
    isArchived: boolean;
  }>;
}) {
  await sendPrivateBroadcast(
    getSessionChannelName(params.sessionId),
    "message.created",
    params.message
  );

  await Promise.all(
    params.viewers.map((viewer) =>
      sendPrivateBroadcast(getUserInboxChannelName(viewer.userId), "message.created", {
        message: params.message,
        conversation: {
          sessionId: params.sessionId,
          peer: viewer.peer,
          latestMessage: params.message.content,
          latestAt: params.message.createdAt,
          isMuted: viewer.isMuted,
          isArchived: viewer.isArchived,
        },
      } satisfies InboxMessageCreatedPayload)
    )
  );
}

export async function broadcastTypingUpdated(payload: TypingUpdatedPayload) {
  await sendPrivateBroadcast(
    getTypingChannelName(payload.sessionId),
    "typing.updated",
    payload
  );
}

export async function broadcastReadReceipt(sessionId: string, readerId: string, readAt: string) {
  await sendPrivateBroadcast(
    getSessionChannelName(sessionId),
    "receipt.read",
    { readerId, readAt }
  );
}

export async function broadcastMessageReactionsUpdated(
  payload: MessageReactionsUpdatedPayload
) {
  await sendPrivateBroadcast(
    getSessionChannelName(payload.sessionId),
    "message.reacted",
    payload
  );
}

export async function broadcastCallStarted(sessionId: string, payload: CallStartedPayload) {
  await sendPrivateBroadcast(
    getSessionChannelName(sessionId),
    "call.started",
    payload
  );
}

export async function broadcastCallEnded(sessionId: string, payload: CallEndedPayload) {
  await sendPrivateBroadcast(
    getSessionChannelName(sessionId),
    "call.ended",
    payload
  );
}
