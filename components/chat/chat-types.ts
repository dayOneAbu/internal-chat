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
  sharedLinks?: SharedLinkItem[];
  sharedDocs?: SharedDocItem[];
  sharedMedia?: SharedMediaItem[];
};

export type SharedLinkItem = {
  url: string;
  title?: string | null;
  description?: string | null;
  accent?: string | null;
};

export type SharedDocItem = {
  name: string;
  meta: string;
  tone?: string | null;
  short?: string | null;
};

export type SharedMediaItem = {
  month: string;
  tone: string;
};

export type SelectedConversation = {
  sessionId: string;
  peer: ChatUser & {
    isOnline: boolean;
  };
  messages: MessageItem[];
  sharedLinks: SharedLinkItem[];
  sharedDocs: SharedDocItem[];
  sharedMedia: {
    month: string;
    items: string[];
  }[];
};

export type RealtimeMessageInsert = {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isAi: boolean;
};
