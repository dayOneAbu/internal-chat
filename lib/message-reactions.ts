import type { Prisma } from "@prisma/client";

export const MESSAGE_REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🔥"] as const;

export type StoredMessageReactions = Record<string, string[]>;

export type MessageReactionSummary = {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
};

export function parseStoredMessageReactions(
  value: Prisma.JsonValue | null | undefined
): StoredMessageReactions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const next: StoredMessageReactions = {};

  for (const [emoji, userIds] of Object.entries(value)) {
    if (typeof emoji !== "string" || !MESSAGE_REACTION_EMOJIS.includes(emoji as never)) {
      continue;
    }

    if (!Array.isArray(userIds)) {
      continue;
    }

    const normalized = Array.from(
      new Set(userIds.filter((userId): userId is string => typeof userId === "string"))
    );

    if (normalized.length > 0) {
      next[emoji] = normalized;
    }
  }

  return next;
}

export function toggleStoredMessageReaction(
  currentValue: Prisma.JsonValue | null | undefined,
  emoji: string,
  userId: string
) {
  const current = parseStoredMessageReactions(currentValue);
  const existingUsers = new Set(current[emoji] ?? []);

  if (existingUsers.has(userId)) {
    existingUsers.delete(userId);
  } else {
    existingUsers.add(userId);
  }

  const next: StoredMessageReactions = {
    ...current,
  };

  if (existingUsers.size === 0) {
    delete next[emoji];
  } else {
    next[emoji] = Array.from(existingUsers);
  }

  return next;
}

export function summarizeMessageReactions(
  value: Prisma.JsonValue | null | undefined,
  currentUserId: string
): MessageReactionSummary[] {
  const parsed = parseStoredMessageReactions(value);

  return MESSAGE_REACTION_EMOJIS.flatMap((emoji) => {
    const users = parsed[emoji] ?? [];

    if (users.length === 0) {
      return [];
    }

    return [
      {
        emoji,
        count: users.length,
        reactedByCurrentUser: users.includes(currentUserId),
      },
    ];
  });
}
