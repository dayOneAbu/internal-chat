export type ChatUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAi: boolean;
};

export type ConversationListItem = ChatUser & {
  sessionId: string;
  latestMessage: string | null;
  latestAt: string | null;
  isSelected: boolean;
  isOnline: boolean;
  isUnread: boolean;
  isMuted: boolean;
};

export type MessageItem = {
  id: string;
  senderId: string;
  senderName: string | null;
  senderEmail: string | null;
  content: string;
  createdAt: string;
  isAi: boolean;
};

export type SelectedConversation = {
  sessionId: string;
  peer: ChatUser & {
    isOnline: boolean;
  };
  messages: MessageItem[];
};

export type RealtimeMessageInsert = {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isAi: boolean;
};
