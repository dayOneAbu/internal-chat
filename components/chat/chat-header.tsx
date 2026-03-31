"use client";

import Link from "next/link";
import { Phone, Video, Search, Ellipsis } from "lucide-react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SelectedConversation } from "./chat-types";
import { UserAvatar, getDisplayName } from "./chat-ui-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function WorkspaceActionButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-9 w-9 rounded-xl border-[#e7e2d7] bg-white text-slate-500 shadow-none hover:bg-[#f8f5ed] hover:text-slate-700",
        className
      )}
    >
      {children}
    </Button>
  );
}

function HoverHint({
  children,
  label,
  description,
  side = "bottom",
}: {
  children: React.ReactNode;
  label: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <div className="space-y-0.5">
          <p className="font-medium text-slate-900">{label}</p>
          {description ? (
            <p className="max-w-44 leading-4 text-slate-500">{description}</p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function ChatHeader({
  activeConversation,
  isPeerTyping,
  isUserOnline,
  onOpenSearch,
  onOpenDetails,
  onStartCall,
  backHref,
}: {
  activeConversation: SelectedConversation;
  isPeerTyping: boolean;
  isUserOnline: (userId: string, isAi?: boolean) => boolean;
  onOpenSearch: () => void;
  onOpenDetails: () => void;
  onStartCall: () => void;
  backHref?: string;
}) {
  return (
    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#efeadf] bg-[#fbf9f3] px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {backHref ? (
          <Button
            asChild
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-slate-500 hover:bg-[#f3efe5] md:hidden"
          >
            <Link href={backHref}>
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
        ) : null}
        <UserAvatar
          user={activeConversation.peer}
          className="h-10 w-10 md:h-11 md:w-11"
          showStatus
          isOnline={isUserOnline(activeConversation.peer.id, activeConversation.peer.isAi)}
        />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 md:text-lg">
            {getDisplayName(activeConversation.peer)}
          </h1>
          <p
            className={cn(
              "truncate text-[11px] font-medium md:text-xs",
              isPeerTyping ||
                isUserOnline(
                  activeConversation.peer.id,
                  activeConversation.peer.isAi
                )
                ? "text-[#34b88e]"
                : "text-slate-400"
            )}
          >
            {isPeerTyping
              ? activeConversation.peer.isAi
                ? "ShipAssist is thinking..."
                : "Typing..."
              : isUserOnline(
                  activeConversation.peer.id,
                  activeConversation.peer.isAi
                )
                  ? "Online"
                  : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <TooltipProvider>
          <HoverHint
            label="Search Conversation"
            description="Find a message or keyword in this thread."
          >
            <WorkspaceActionButton onClick={onOpenSearch}>
              <Search className="size-4" />
            </WorkspaceActionButton>
          </HoverHint>
          <HoverHint
            label="Start Audio Call"
            description="Begin a voice call with this contact."
          >
            <WorkspaceActionButton onClick={onStartCall}>
              <Phone className="size-4" />
            </WorkspaceActionButton>
          </HoverHint>
          <HoverHint
            label="Start Video Call"
            description="Begin a video call with this contact."
          >
            <WorkspaceActionButton onClick={onStartCall}>
              <Video className="size-4" />
            </WorkspaceActionButton>
          </HoverHint>
          <HoverHint
            label="Contact Details"
            description="Show shared files, links, and profile details."
          >
            <WorkspaceActionButton onClick={onOpenDetails}>
              <Ellipsis className="size-4" />
            </WorkspaceActionButton>
          </HoverHint>
        </TooltipProvider>
      </div>
    </div>
  );
}
