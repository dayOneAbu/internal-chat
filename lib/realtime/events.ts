import type { MessageAssetKind, User } from "@prisma/client";

import type {
  ChatUser,
  MessageReactionItem,
  SharedDocItem,
  SharedLinkItem,
  SharedMediaItem,
} from "@/components/chat/chat-types";
import { mapAssetRecords } from "@/lib/chat-shared-assets";
import {
  summarizeMessageReactions,
  type StoredMessageReactions,
} from "@/lib/message-reactions";

export type PresenceMemberPayload = {
  userId: string;
  onlineAt: string;
};

export type TypingUpdatedPayload = {
  sessionId: string;
  userId: string;
  state: "active" | "idle";
};

export type CallStartedPayload = {
  callId: string;
  roomName: string;
  initiatorId: string;
};

export type CallEndedPayload = {
  callId: string;
};

export type RealtimeMessagePayload = {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string | null;
  senderEmail: string | null;
  content: string;
  createdAt: string;
  isAi: boolean;
  reactions: MessageReactionItem[];
  sharedLinks: SharedLinkItem[];
  sharedDocs: SharedDocItem[];
  sharedMedia: SharedMediaItem[];
};

export type MessageReactionsUpdatedPayload = {
  sessionId: string;
  messageId: string;
  reactions: StoredMessageReactions;
};

export type InboxMessageCreatedPayload = {
  message: RealtimeMessagePayload;
  conversation: {
    sessionId: string;
    peer: ChatUser;
    latestMessage: string;
    latestAt: string;
    isMuted: boolean;
    isArchived: boolean;
  };
};

type AssetRecordLike = {
  kind: MessageAssetKind;
  url: string | null;
  title: string | null;
  description: string | null;
  accent: string | null;
  name: string | null;
  meta: string | null;
  short: string | null;
  tone: string | null;
  month: string | null;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
};

export function serializeChatUser(
  user: Pick<User, "id" | "name" | "email" | "avatarUrl" | "isAi">
): ChatUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    isAi: user.isAi,
  };
}

export function mapMessageAssetsToPayload(
  assets: AssetRecordLike[]
): Pick<RealtimeMessagePayload, "sharedLinks" | "sharedDocs" | "sharedMedia"> {
  const mapped = mapAssetRecords(
    assets.map((asset) => ({
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
      fileUrl: asset.fileUrl,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType,
    }))
  );

  return {
    sharedLinks: mapped.sharedLinks,
    sharedDocs: mapped.sharedDocs,
    sharedMedia: mapped.sharedMedia.flatMap((group) =>
      group.items.map((item) => ({
        month: group.month,
        tone: item.tone,
        fileUrl: item.fileUrl,
        fileSize: item.fileSize,
        mimeType: item.mimeType,
      }))
    ),
  };
}

export function serializeRealtimeMessage(message: {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isAi: boolean;
  reactions: unknown;
  sender: Pick<User, "name" | "email">;
  assets: AssetRecordLike[];
}, currentUserId?: string): RealtimeMessagePayload {
  const assets = mapMessageAssetsToPayload(message.assets);

  return {
    id: message.id,
    sessionId: message.sessionId,
    senderId: message.senderId,
    senderName: message.sender.name,
    senderEmail: message.sender.email,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    isAi: message.isAi,
    reactions: summarizeMessageReactions(message.reactions as never, currentUserId ?? ""),
    sharedLinks: assets.sharedLinks,
    sharedDocs: assets.sharedDocs,
    sharedMedia: assets.sharedMedia,
  };
}
