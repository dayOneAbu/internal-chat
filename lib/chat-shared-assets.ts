import type {
  SharedDocItem,
  SharedLinkItem,
  SharedMediaItem,
} from "@/components/chat/chat-types";

type MessageLike = {
  sharedLinks: unknown;
  sharedDocs: unknown;
  sharedMedia: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSharedLinks(value: unknown): SharedLinkItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.url !== "string") {
      return [];
    }

    return [
      {
        url: entry.url,
        title: typeof entry.title === "string" ? entry.title : null,
        description:
          typeof entry.description === "string" ? entry.description : null,
        accent: typeof entry.accent === "string" ? entry.accent : null,
      },
    ];
  });
}

export function parseSharedDocs(value: unknown): SharedDocItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.name !== "string" ||
      typeof entry.meta !== "string"
    ) {
      return [];
    }

    return [
      {
        name: entry.name,
        meta: entry.meta,
        tone: typeof entry.tone === "string" ? entry.tone : null,
        short: typeof entry.short === "string" ? entry.short : null,
      },
    ];
  });
}

export function parseSharedMedia(value: unknown): SharedMediaItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      typeof entry.month !== "string" ||
      typeof entry.tone !== "string"
    ) {
      return [];
    }

    return [
      {
        month: entry.month,
        tone: entry.tone,
      },
    ];
  });
}

export function extractConversationSharedAssets(messages: MessageLike[]) {
  const sharedLinks = messages.flatMap((message) =>
    parseSharedLinks(message.sharedLinks)
  );
  const sharedDocs = messages.flatMap((message) =>
    parseSharedDocs(message.sharedDocs)
  );
  const sharedMediaItems = messages.flatMap((message) =>
    parseSharedMedia(message.sharedMedia)
  );

  const mediaMap = new Map<string, string[]>();

  for (const item of sharedMediaItems) {
    const current = mediaMap.get(item.month) ?? [];
    current.push(item.tone);
    mediaMap.set(item.month, current);
  }

  const sharedMedia = Array.from(mediaMap.entries()).map(([month, items]) => ({
    month,
    items,
  }));

  return {
    sharedLinks,
    sharedDocs,
    sharedMedia,
  };
}
