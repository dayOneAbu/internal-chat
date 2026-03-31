"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageItem } from "./message-item";
import { ChatUser, SelectedConversation } from "./chat-types";

export function MessageList({
  activeConversation,
  currentUser,
  toggleMessageReactionAction,
}: {
  activeConversation: SelectedConversation;
  currentUser: ChatUser;
  toggleMessageReactionAction: (messageId: string, emoji: string) => Promise<unknown>;
}) {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [activeConversation.messages.length, activeConversation.sessionId]);

  return (
    <ScrollArea
      className="min-h-0 flex-1"
      viewportClassName="h-full overscroll-contain [&>div]:!flex [&>div]:min-h-full [&>div]:w-full"
    >
      <div className="flex min-h-full w-full flex-1 flex-col justify-end bg-[#f6f3ea]/50 px-4 pb-3 pt-6 md:px-8 md:pb-4">
        <div className="space-y-6">
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="rounded-full border-[#efeadf] bg-white/80 px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 shadow-sm backdrop-blur-sm"
            >
              Today
            </Badge>
          </div>

          <div className="space-y-6">
            {activeConversation.messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === currentUser.id}
                toggleMessageReactionAction={toggleMessageReactionAction}
              />
            ))}
            <div ref={messageEndRef} className="h-2" />
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
