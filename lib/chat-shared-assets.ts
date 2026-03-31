import type {
  SharedDocItem,
  SharedLinkItem,
  SharedMediaItem,
} from "@/components/chat/chat-types";

type MessageLike = {
  assets?: AssetRecordLike[];
  sharedLinks?: unknown;
  sharedDocs?: unknown;
  sharedMedia?: unknown;
};

export type AssetRecordLike = {
  kind: "link" | "doc" | "media";
  url?: string | null;
  title?: string | null;
  description?: string | null;
  accent?: string | null;
  name?: string | null;
  meta?: string | null;
  short?: string | null;
  tone?: string | null;
  month?: string | null;
  fileUrl?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
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

export type UploadedAssetItem = {
  kind: "media" | "doc";
  fileUrl: string;
  name: string | null;
  mimeType: string | null;
  fileSize: number | null;
};

export function parseUploadedAssets(value: unknown): UploadedAssetItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.url !== "string") {
      return [];
    }

    return [
      {
        kind: entry.kind === "media" ? "media" : "doc",
        fileUrl: entry.url,
        name: typeof entry.name === "string" ? entry.name : null,
        mimeType: typeof entry.mimeType === "string" ? entry.mimeType : null,
        fileSize: typeof entry.fileSize === "number" ? entry.fileSize : null,
      },
    ];
  });
}

export function dedupeSharedLinks(items: SharedLinkItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.url}|${item.title ?? ""}|${item.description ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function dedupeSharedDocs(items: SharedDocItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.name}|${item.meta}|${item.short ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function dedupeSharedMedia(items: SharedMediaItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.month}|${item.tone}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function groupSharedMedia(items: SharedMediaItem[]) {
  const mediaMap = new Map<string, SharedMediaItem[]>();

  for (const item of dedupeSharedMedia(items)) {
    const current = mediaMap.get(item.month) ?? [];
    current.push(item);
    mediaMap.set(item.month, current);
  }

  return Array.from(mediaMap.entries()).map(([month, groupedItems]) => ({
    month,
    items: groupedItems,
  }));
}

export function mapAssetRecords(records: AssetRecordLike[]) {
  const sharedLinks = dedupeSharedLinks(
    records.flatMap((record) => {
      if (record.kind !== "link" || !record.url) {
        return [];
      }

      return [
        {
          url: record.url,
          title: record.title ?? null,
          description: record.description ?? null,
          accent: record.accent ?? null,
        },
      ];
    })
  );

  const sharedDocs = dedupeSharedDocs(
    records.flatMap((record) => {
      if (record.kind !== "doc" || !record.name || !record.meta) {
        return [];
      }

      return [
        {
          name: record.name,
          meta: record.meta,
          short: record.short ?? null,
          tone: record.tone ?? null,
          fileUrl: record.fileUrl ?? null,
          fileSize: record.fileSize ?? null,
          mimeType: record.mimeType ?? null,
        },
      ];
    })
  );

  const sharedMediaItems = dedupeSharedMedia(
    records.flatMap((record) => {
      if (record.kind !== "media" || !record.month || !record.tone) {
        return [];
      }

      return [
        {
          month: record.month,
          tone: record.tone,
          fileUrl: record.fileUrl ?? null,
          fileSize: record.fileSize ?? null,
          mimeType: record.mimeType ?? null,
        },
      ];
    })
  );

  return {
    sharedLinks,
    sharedDocs,
    sharedMedia: groupSharedMedia(sharedMediaItems),
  };
}

export function extractConversationSharedAssets(messages: MessageLike[]) {
  const assetBackedRecords = messages.flatMap((message) => message.assets ?? []);

  if (assetBackedRecords.length > 0) {
    return mapAssetRecords(assetBackedRecords);
  }

  const sharedLinks = dedupeSharedLinks(
    messages.flatMap((message) => parseSharedLinks(message.sharedLinks))
  );
  const sharedDocs = dedupeSharedDocs(
    messages.flatMap((message) => parseSharedDocs(message.sharedDocs))
  );
  const sharedMediaItems = dedupeSharedMedia(
    messages.flatMap((message) => parseSharedMedia(message.sharedMedia))
  );

  return {
    sharedLinks,
    sharedDocs,
    sharedMedia: groupSharedMedia(sharedMediaItems),
  };
}
