"use client";

import { create } from "zustand";

import type {
  ChatUser,
  ConversationListItem,
  MessageReactionItem,
  RealtimeMessageInsert,
  SelectedConversation,
} from "@/components/chat/chat-types";
import { extractConversationSharedAssets } from "@/lib/chat-shared-assets";

type ChatWorkspaceState = {
  contacts: ChatUser[];
  conversationItems: ConversationListItem[];
  activeConversation: SelectedConversation | null;
  detailsOpen: boolean;
  newMessageOpen: boolean;
  searchOpen: boolean;
  listQuery: string;
  messageSearchQuery: string;
  newMessageQuery: string;
  presenceByUserId: Record<string, true>;
  typingBySessionId: Record<string, string[]>;
  activeCall: { callId: string; roomName: string } | null;
  initialize: (payload: {
    contacts: ChatUser[];
    conversations: ConversationListItem[];
    selectedConversation: SelectedConversation | null;
  }) => void;
  setDetailsOpen: (open: boolean) => void;
  setNewMessageOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setListQuery: (query: string) => void;
  setMessageSearchQuery: (query: string) => void;
  setNewMessageQuery: (query: string) => void;
  setPresenceMembers: (userIds: string[]) => void;
  setTypingUsers: (sessionId: string, userIds: string[]) => void;
  setActiveCall: (call: { callId: string; roomName: string } | null) => void;
  applyMessageReactions: (
    sessionId: string,
    messageId: string,
    reactions: MessageReactionItem[]
  ) => void;
  applyInsertedMessage: (
    message: RealtimeMessageInsert,
    currentUserId: string,
    conversationMeta?: {
      sessionId: string;
      peer: ChatUser;
      latestMessage: string;
      latestAt: string;
      isMuted: boolean;
      isArchived: boolean;
    }
  ) => void;
  applyReadReceipt?: (sessionId: string, readAt: string) => void;
};

export const useChatWorkspaceStore = create<ChatWorkspaceState>((set, get) => ({
  contacts: [],
  conversationItems: [],
  activeConversation: null,
  detailsOpen: false,
  newMessageOpen: false,
  searchOpen: false,
  listQuery: "",
  messageSearchQuery: "",
  newMessageQuery: "",
  presenceByUserId: {},
  typingBySessionId: {},
  activeCall: null,
  initialize: ({ contacts, conversations, selectedConversation }) =>
    set({
      contacts,
      conversationItems: conversations,
      activeConversation: selectedConversation,
      detailsOpen: get().detailsOpen,
      searchOpen: get().searchOpen,
      messageSearchQuery: get().messageSearchQuery,
      presenceByUserId: get().presenceByUserId,
      typingBySessionId: get().typingBySessionId,
    }),
  setDetailsOpen: (detailsOpen) => set({ detailsOpen }),
  setNewMessageOpen: (newMessageOpen) => set({ newMessageOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setListQuery: (listQuery) => set({ listQuery }),
  setMessageSearchQuery: (messageSearchQuery) => set({ messageSearchQuery }),
  setNewMessageQuery: (newMessageQuery) => set({ newMessageQuery }),
  setPresenceMembers: (userIds) =>
    set({
      presenceByUserId: Object.fromEntries(userIds.map((userId) => [userId, true])),
    }),
  setTypingUsers: (sessionId, userIds) =>
    set((state) => ({
      typingBySessionId: {
        ...state.typingBySessionId,
        [sessionId]: userIds,
      },
    })),
  setActiveCall: (activeCall) => set({ activeCall }),
  applyMessageReactions: (sessionId, messageId, reactions) =>
    set((state) => {
      const activeConversation = state.activeConversation;

      if (!activeConversation || activeConversation.sessionId !== sessionId) {
        return state;
      }

      let hasChanges = false;
      const nextMessages = activeConversation.messages.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        hasChanges = true;
        return {
          ...message,
          reactions,
        };
      });

      if (!hasChanges) {
        return state;
      }

      return {
        activeConversation: {
          ...activeConversation,
          messages: nextMessages,
        },
      };
    }),
  applyInsertedMessage: (message, currentUserId, conversationMeta) =>
    set((state) => {
      const activeConversation = state.activeConversation;
      const isActiveConversation =
        activeConversation?.sessionId === message.sessionId;
      const incrementsUnread =
        message.senderId !== currentUserId && !isActiveConversation;

      const nextConversationItems = [
        ...state.conversationItems.filter(
          (conversation) => conversation.sessionId !== message.sessionId
        ),
        (
          state.conversationItems.find(
            (conversation) => conversation.sessionId === message.sessionId
          ) ??
          (conversationMeta && !conversationMeta.isArchived
            ? {
                ...conversationMeta.peer,
                sessionId: conversationMeta.sessionId,
                latestMessage: conversationMeta.latestMessage,
                latestAt: conversationMeta.latestAt,
                isSelected: false,
                isOnline: false,
                isUnread: incrementsUnread,
                unreadCount: incrementsUnread ? 1 : 0,
                isMuted: conversationMeta.isMuted,
              }
            : null)
        ),
      ]
        .filter(
          (conversation): conversation is ConversationListItem => conversation !== null
        )
        .map((conversation) =>
          conversation.sessionId === message.sessionId
            ? {
                ...conversation,
                latestMessage: message.content,
                latestAt: message.createdAt,
                isUnread:
                  conversation.sessionId === message.sessionId
                    ? incrementsUnread ||
                      (!isActiveConversation && conversation.unreadCount > 0)
                    : conversation.isUnread,
                unreadCount:
                  conversation.sessionId === message.sessionId
                    ? incrementsUnread
                      ? conversation.unreadCount + 1
                      : isActiveConversation
                        ? 0
                        : conversation.unreadCount
                    : conversation.unreadCount,
                isMuted: conversationMeta?.isMuted ?? conversation.isMuted,
              }
            : conversation
        )
        .sort((left, right) => {
          const leftTime = left.latestAt ? new Date(left.latestAt).getTime() : 0;
          const rightTime = right.latestAt ? new Date(right.latestAt).getTime() : 0;

          return rightTime - leftTime;
        });

      const nextContacts = conversationMeta
        ? state.contacts.some((contact) => contact.id === conversationMeta.peer.id)
          ? state.contacts
          : [...state.contacts, conversationMeta.peer]
        : state.contacts;

      if (
        !isActiveConversation ||
        !activeConversation ||
        activeConversation.messages.some((entry) => entry.id === message.id)
      ) {
        return {
          contacts: nextContacts,
          conversationItems: nextConversationItems,
        };
      }

      const sender = [state.contacts, [activeConversation.peer]]
        .flat()
        .find((contact) => contact.id === message.senderId);

      return {
        conversationItems: nextConversationItems,
        activeConversation: {
          ...activeConversation,
          ...(extractConversationSharedAssets([
            ...activeConversation.messages,
            {
              sharedLinks: message.sharedLinks,
              sharedDocs: message.sharedDocs,
              sharedMedia: message.sharedMedia,
            },
          ]) as Pick<
            SelectedConversation,
            "sharedLinks" | "sharedDocs" | "sharedMedia"
          >),
          messages: [
            ...activeConversation.messages,
            {
              id: message.id,
              senderId: message.senderId,
              senderName: sender?.name ?? null,
              senderEmail: sender?.email ?? null,
              content: message.content,
              createdAt: message.createdAt,
              isAi: message.isAi,
              isReadByPeer: false,
              reactions: message.reactions,
              sharedLinks: message.sharedLinks,
              sharedDocs: message.sharedDocs,
              sharedMedia: message.sharedMedia,
            },
          ],
        },
        contacts: nextContacts,
      };
    }),
  applyReadReceipt: (sessionId, readAt) =>
    set((state) => {
      const activeConversation = state.activeConversation;
      if (!activeConversation || activeConversation.sessionId !== sessionId) {
        return state;
      }
      
      const readDate = new Date(readAt).getTime();
      let hasChanges = false;
      const nextMessages = activeConversation.messages.map((message) => {
        if (!message.isReadByPeer && message.senderId !== activeConversation.peer.id) {
          const createdAtDate = new Date(message.createdAt).getTime();
          if (createdAtDate <= readDate) {
            hasChanges = true;
            return { ...message, isReadByPeer: true };
          }
        }
        return message;
      });

      if (!hasChanges) {
        return state;
      }

      return {
        activeConversation: {
          ...activeConversation,
          messages: nextMessages,
        },
      };
    }),
}));
