"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";

import type { MessageItem } from "@/components/chat/chat-types";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatMessageTime } from "@/components/chat/chat-ui-utils";
import { cn } from "@/lib/utils";

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-[#fff1bf] px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

export function MessageSearchPanel({
  currentUserId,
  messages,
  onOpenChange,
  onQueryChange,
  open,
  query,
}: {
  currentUserId: string;
  messages: MessageItem[];
  onOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  open: boolean;
  query: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = useMemo(
    () =>
      normalizedQuery
        ? messages.filter((message) =>
            message.content.toLowerCase().includes(normalizedQuery)
          )
        : [],
    [messages, normalizedQuery]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l-[#ece7dc] bg-[#fbf9f3] p-0 sm:max-w-md"
      >
        <SheetHeader className="gap-3 border-b border-[#ece7dc] px-5 py-4">
          <div className="space-y-1">
            <SheetTitle>Search Conversation</SheetTitle>
            <SheetDescription>
              Find a message in the active thread and jump straight to it.
            </SheetDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search messages..."
              className="h-10 rounded-xl border-[#e7e2d6] bg-white pl-9 text-sm"
            />
          </div>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-3 py-3">
          {!normalizedQuery ? (
            <div className="rounded-2xl border border-dashed border-[#e7e2d6] bg-white/70 px-4 py-5 text-sm text-slate-500">
              Start typing to search across {messages.length} visible messages in
              this thread.
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e7e2d6] bg-white/70 px-4 py-5 text-sm text-slate-500">
              No messages matched “{query}”.
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((message) => {
                const isCurrentUser = message.senderId === currentUserId;

                return (
                  <button
                    key={message.id}
                    type="button"
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                      isCurrentUser
                        ? "border-[#d9f0e8] bg-[#effaf6] hover:bg-[#e6f7f0]"
                        : "border-[#ece7dc] bg-white hover:bg-[#faf7f1]"
                    )}
                    onClick={() => {
                      onOpenChange(false);
                      requestAnimationFrame(() => {
                        document
                          .getElementById(`message-${message.id}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "center" });
                      });
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {isCurrentUser ? "You" : "Them"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatMessageTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-700">
                      <HighlightedText text={message.content} query={query} />
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
