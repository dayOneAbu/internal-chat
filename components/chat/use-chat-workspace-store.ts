"use client";

import { create } from "zustand";

import type {
  ChatUser,
  ConversationListItem,
  RealtimeMessageInsert,
  SelectedConversation,
} from "@/components/chat/chat-types";

type ChatWorkspaceState = {
  contacts: ChatUser[];
  conversationItems: ConversationListItem[];
  activeConversation: SelectedConversation | null;
  detailsOpen: boolean;
  newMessageOpen: boolean;
  listQuery: string;
  newMessageQuery: string;
  onlineUserIds: string[];
  initialize: (payload: {
    contacts: ChatUser[];
    conversations: ConversationListItem[];
    selectedConversation: SelectedConversation | null;
  }) => void;
  setDetailsOpen: (open: boolean) => void;
  setNewMessageOpen: (open: boolean) => void;
  setListQuery: (query: string) => void;
  setNewMessageQuery: (query: string) => void;
  setOnlineUserIds: (userIds: string[]) => void;
  applyInsertedMessage: (
    message: RealtimeMessageInsert,
    currentUserId: string
  ) => void;
};

export const useChatWorkspaceStore = create<ChatWorkspaceState>((set, get) => ({
  contacts: [],
  conversationItems: [],
  activeConversation: null,
  detailsOpen: false,
  newMessageOpen: false,
  listQuery: "",
  newMessageQuery: "",
  onlineUserIds: [],
  initialize: ({ contacts, conversations, selectedConversation }) =>
    set({
      contacts,
      conversationItems: conversations,
      activeConversation: selectedConversation,
      detailsOpen: Boolean(selectedConversation),
      onlineUserIds: get().onlineUserIds,
    }),
  setDetailsOpen: (detailsOpen) => set({ detailsOpen }),
  setNewMessageOpen: (newMessageOpen) => set({ newMessageOpen }),
  setListQuery: (listQuery) => set({ listQuery }),
  setNewMessageQuery: (newMessageQuery) => set({ newMessageQuery }),
  setOnlineUserIds: (onlineUserIds) => set({ onlineUserIds }),
  applyInsertedMessage: (message, currentUserId) =>
    set((state) => {
      const existingConversation = state.conversationItems.find(
        (conversation) => conversation.sessionId === message.sessionId
      );

      if (!existingConversation) {
        return state;
      }

      const nextConversationItems = state.conversationItems
        .map((conversation) => {
          if (conversation.sessionId !== message.sessionId) {
            return conversation;
          }

          return {
            ...conversation,
            latestMessage: message.content,
            latestAt: message.createdAt,
            isUnread:
              message.senderId !== currentUserId &&
              state.activeConversation?.sessionId !== message.sessionId,
          };
        })
        .sort((left, right) => {
          const leftTime = left.latestAt ? new Date(left.latestAt).getTime() : 0;
          const rightTime = right.latestAt ? new Date(right.latestAt).getTime() : 0;

          return rightTime - leftTime;
        });

      if (
        !state.activeConversation ||
        state.activeConversation.sessionId !== message.sessionId ||
        state.activeConversation.messages.some((entry) => entry.id === message.id)
      ) {
        return {
          conversationItems: nextConversationItems,
        };
      }

      const sender = [state.contacts, [state.activeConversation.peer]]
        .flat()
        .find((contact) => contact.id === message.senderId);

      return {
        conversationItems: nextConversationItems,
        activeConversation: {
          ...state.activeConversation,
          messages: [
            ...state.activeConversation.messages,
            {
              id: message.id,
              senderId: message.senderId,
              senderName: sender?.name ?? null,
              senderEmail: sender?.email ?? null,
              content: message.content,
              createdAt: message.createdAt,
              isAi: message.isAi,
            },
          ],
        },
      };
    }),
}));
