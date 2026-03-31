"use client";

import { useTransition } from "react";
import { Check, CheckCheck, Link2, SmilePlus } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "./chat-ui-utils";
import type { MessageItem as ChatMessage } from "./chat-types";
import { MESSAGE_REACTION_EMOJIS } from "@/lib/message-reactions";

export type MessageItemProps = {
  message: ChatMessage;
  isCurrentUser: boolean;
  toggleMessageReactionAction: (messageId: string, emoji: string) => Promise<unknown>;
};

export function MessageItem({
  message,
  isCurrentUser,
  toggleMessageReactionAction,
}: MessageItemProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group flex animate-in fade-in slide-in-from-bottom-2 duration-300",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[85%] sm:max-w-md", isCurrentUser && "items-end")}>
        <div
          className={cn(
            "rounded-[20px] px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all",
            isCurrentUser
              ? "rounded-br-md bg-[#2ea48c] text-white selection:bg-white/30"
              : "rounded-bl-md bg-white text-slate-700 selection:bg-[#2ea48c]/10"
          )}
        >
          {message.content}

          {message.sharedLinks && message.sharedLinks.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.sharedLinks.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
                    isCurrentUser 
                      ? "border-white/20 bg-white/10 hover:bg-white/20" 
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="truncate text-xs font-medium">
                    {item.title ?? item.url}
                  </span>
                </div>
              ))}
            </div>
          )}

          {message.sharedDocs && message.sharedDocs.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.sharedDocs.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors",
                    isCurrentUser 
                      ? "border-white/20 bg-white/10 hover:bg-white/20" 
                      : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold shadow-sm",
                      item.tone
                    )}
                  >
                    {item.short}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{item.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {message.sharedMedia && message.sharedMedia.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.sharedMedia.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-xl border border-black/5 bg-slate-100 shadow-inner",
                    !item.fileUrl && (item.tone ?? "bg-slate-200")
                  )}
                >
                  {item.fileUrl && (
                    <Image
                      src={item.fileUrl}
                      alt="Shared media"
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {message.reactions?.map((reaction) => (
            <button
              key={`${message.id}-${reaction.emoji}`}
              type="button"
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors",
                reaction.reactedByCurrentUser
                  ? "border-[#2ea48c]/30 bg-[#e9faf4] text-[#1f7c68]"
                  : "border-[#e8e2d6] bg-white text-slate-600 hover:bg-[#f7f4ec]"
              )}
              onClick={() =>
                startTransition(() => {
                  void toggleMessageReactionAction(message.id, reaction.emoji);
                })
              }
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          ))}

          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-[#e3ddd0] bg-white text-slate-400">
              <SmilePlus className="size-3.5" />
            </div>
            {MESSAGE_REACTION_EMOJIS.map((emoji) => (
              <button
                key={`${message.id}-${emoji}-picker`}
                type="button"
                disabled={isPending}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e8e2d6] bg-white text-sm transition-colors hover:bg-[#f7f4ec]"
                onClick={() =>
                  startTransition(() => {
                    void toggleMessageReactionAction(message.id, emoji);
                  })
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1.5 px-1 text-[10px] font-medium text-slate-400",
            isCurrentUser && "justify-end"
          )}
        >
          {isCurrentUser && (
            message.isReadByPeer ? (
              <CheckCheck className="size-3 text-[#34b88e]" />
            ) : (
              <Check className="size-3 text-slate-300" />
            )
          )}
          <span>{formatMessageTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
