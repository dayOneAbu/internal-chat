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
  const channelId = `broadcast-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const channel = supabase.channel(channelId, {
    config: {
      private: false,
    },
  });

  // Use a shorter timeout and don't block the main thread if it fails
  const broadcastPromise = (async () => {
    try {
      // Race against a 2.5s timeout to prevent 10s+ hangs
      const result = await Promise.race([
        channel.httpSend(event, payload),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Broadcast timeout")), 2500)
        )
      ]);

      if (typeof result === 'object' && result !== null && 'success' in result && !result.success) {
        console.error(`[Realtime] Broadcast failed: ${topic}/${event}`, result.error);
      }
    } catch (error) {
      console.error(`[Realtime] Broadcast error: ${topic}/${event}`, error);
    } finally {
      supabase.removeChannel(channel).catch(() => {});
    }
  })();

  // We await it here but in a transaction-safe way or fire-and-forget
  // For critical messaging, we might want to wait, but for receipts, we don't.
  return broadcastPromise;
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
