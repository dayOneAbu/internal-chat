"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type {
  RealtimeChannel,
  RealtimeChannelOptions,
} from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getSessionChannelName,
  getTypingChannelName,
  getUserInboxChannelName,
  WORKSPACE_PRESENCE_CHANNEL,
} from "@/lib/realtime/channels";
import type {
  InboxMessageCreatedPayload,
  MessageReactionsUpdatedPayload,
  PresenceMemberPayload,
  TypingUpdatedPayload,
  CallStartedPayload,
  CallEndedPayload,
} from "@/lib/realtime/events";
import type { RealtimeMessageInsert } from "@/components/chat/chat-types";
import { useChatWorkspaceStore } from "@/components/chat/use-chat-workspace-store";
import { summarizeMessageReactions } from "@/lib/message-reactions";

const MAX_RETRIES = 3;

/**
 * Creates a robust channel subscription with exponential backoff on disconnects.
 */
function createRobustChannel(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
  channelId: string,
  options: RealtimeChannelOptions,
  setupChannel: (channel: RealtimeChannel) => void,
  onJoin?: (channel: RealtimeChannel) => Promise<void>
) {
  let retries = 0;
  let activeChannel: RealtimeChannel | null = null;
  let isUnmounted = false;

  const connect = () => {
    if (isUnmounted) return;

    if (activeChannel) {
      supabase.removeChannel(activeChannel);
    }

    const channel = supabase.channel(channelId, options);
    activeChannel = channel;

    setupChannel(channel);

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        retries = 0; // reset retries on success
        if (onJoin && !isUnmounted) {
          await onJoin(channel);
        }
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (isUnmounted) return;
        
        if (retries < MAX_RETRIES) {
          const timeout = Math.pow(2, retries) * 1000 + Math.random() * 1000;
          retries++;
          console.warn(`[Realtime] ${channelId} disconnected (${status}). Retrying in ${Math.round(timeout)}ms... (Attempt ${retries})`);
          setTimeout(connect, timeout);
        } else {
          console.error(`[Realtime] ${channelId} disconnected and reached max retries.`);
        }
      }
    });
  };

  connect();

  return () => {
    isUnmounted = true;
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
  };
}

export function useChatRealtime(currentUserId: string, activeSessionId?: string) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const {
    setPresenceMembers,
    applyInsertedMessage,
    applyMessageReactions,
    setTypingUsers,
    applyReadReceipt,
    setActiveCall,
  } = useChatWorkspaceStore();

  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingStateRef = useRef<Record<string, "active" | "idle">>({});
  const typingUsersRef = useRef<Record<string, Set<string>>>({});

  // 1. Workspace Presence
  useEffect(() => {
    const syncPresenceMembers = (channel: RealtimeChannel) => {
      const state = channel.presenceState();
      const nextUserIds = Object.values(state).flatMap((entries) =>
        entries.flatMap((entry) => {
          const data = entry as unknown as PresenceMemberPayload | undefined;
          return typeof data?.userId === "string" && data.userId.length > 0
            ? [data.userId]
            : [];
        })
      );
      setPresenceMembers([...new Set(nextUserIds)]);
    };

    return createRobustChannel(
      supabase,
      WORKSPACE_PRESENCE_CHANNEL,
      {
        config: {
          private: true,
          presence: { key: currentUserId },
        },
      },
      (channel) => {
        channel
          .on("presence", { event: "sync" }, () => syncPresenceMembers(channel))
          .on("presence", { event: "join" }, () => syncPresenceMembers(channel))
          .on("presence", { event: "leave" }, () => syncPresenceMembers(channel));
      },
      async (channel) => {
        await channel.track({
          userId: currentUserId,
          onlineAt: new Date().toISOString(),
        } satisfies PresenceMemberPayload);
        syncPresenceMembers(channel);
      }
    );
  }, [currentUserId, setPresenceMembers, supabase]);

  // 2. User Inbox (listens to all conversations)
  useEffect(() => {
    return createRobustChannel(
      supabase,
      getUserInboxChannelName(currentUserId),
      { config: { private: true } },
      (channel) => {
        channel.on(
          "broadcast",
          { event: "message.created" },
          ({ payload }: { payload: InboxMessageCreatedPayload }) => {
            if (payload?.message && payload?.conversation) {
              applyInsertedMessage(payload.message as unknown as RealtimeMessageInsert, currentUserId, payload.conversation);
            }
          }
        );
      }
    );
  }, [currentUserId, applyInsertedMessage, supabase]);

  // 3. Active Session (messages, receipts)
  useEffect(() => {
    if (!activeSessionId) return;

    return createRobustChannel(
      supabase,
      getSessionChannelName(activeSessionId),
      { config: { private: true } },
      (channel) => {
        channel.on(
          "broadcast",
          { event: "message.created" },
          ({ payload }: { payload: RealtimeMessageInsert }) => {
            if (payload) {
              applyInsertedMessage(payload, currentUserId);
            }
          }
        );

        channel.on(
          "broadcast",
          { event: "message.reacted" },
          ({ payload }: { payload: MessageReactionsUpdatedPayload }) => {
            if (payload) {
              applyMessageReactions(
                payload.sessionId,
                payload.messageId,
                summarizeMessageReactions(payload.reactions as never, currentUserId)
              );
            }
          }
        );
        
        channel.on(
          "broadcast",
          { event: "receipt.read" },
          ({ payload }: { payload: { readerId: string; readAt: string } }) => {
            if (payload && payload.readerId !== currentUserId) {
              if (applyReadReceipt) {
                applyReadReceipt(activeSessionId, payload.readAt);
              }
            }
          }
        );

        channel.on(
          "broadcast",
          { event: "call.started" },
          ({ payload }: { payload: CallStartedPayload }) => {
            if (payload && payload.initiatorId !== currentUserId) {
              setActiveCall({ callId: payload.callId, roomName: payload.roomName });
            }
          }
        );

        channel.on(
          "broadcast",
          { event: "call.ended" },
          ({ payload }: { payload: CallEndedPayload }) => {
            if (payload) {
              setActiveCall(null);
            }
          }
        );
      }
    );
  }, [
    activeSessionId,
    currentUserId,
    applyInsertedMessage,
    applyMessageReactions,
    applyReadReceipt,
    setActiveCall,
    supabase,
  ]);

  // 4. Typing State for Active Session
  useEffect(() => {
    if (!activeSessionId) return;

    const sessionId = activeSessionId;
    typingUsersRef.current[sessionId] = typingUsersRef.current[sessionId] ?? new Set<string>();
    
    // reset store typing users for this session initially
    setTypingUsers(sessionId, Array.from(typingUsersRef.current[sessionId]));

    return createRobustChannel(
      supabase,
      getTypingChannelName(sessionId),
      { config: { private: true } },
      (channel) => {
        typingChannelRef.current = channel;
        
        channel.on(
          "broadcast",
          { event: "typing.updated" },
          ({ payload }: { payload: TypingUpdatedPayload }) => {
            if (!payload || payload.userId === currentUserId) return;

            const sessionTypingUsers = typingUsersRef.current[payload.sessionId] ?? new Set<string>();
            if (payload.state === "active") {
              sessionTypingUsers.add(payload.userId);
            } else {
              sessionTypingUsers.delete(payload.userId);
            }
            typingUsersRef.current[payload.sessionId] = sessionTypingUsers;
            setTypingUsers(payload.sessionId, Array.from(sessionTypingUsers));
          }
        );
      },
      async (channel) => {
        typingChannelRef.current = channel;
      }
    );
  }, [activeSessionId, currentUserId, setTypingUsers, supabase]);

  // Exported publish handler
  const publishTypingState = useCallback(async (state: "active" | "idle") => {
    if (!activeSessionId) return;
    if (lastTypingStateRef.current[activeSessionId] === state) return;

    lastTypingStateRef.current[activeSessionId] = state;
    const channel = typingChannelRef.current;
    if (!channel) return;

    try {
      await channel.send({
        type: "broadcast",
        event: "typing.updated",
        payload: {
          sessionId: activeSessionId,
          userId: currentUserId,
          state,
        } satisfies TypingUpdatedPayload,
      });
    } catch (err) {
      console.warn("[Realtime] Failed to broadcast typing state", err);
    }
  }, [activeSessionId, currentUserId]);

  return { publishTypingState };
}
