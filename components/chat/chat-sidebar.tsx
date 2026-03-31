"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  PenSquare, 
  Archive,
  MoreHorizontal, 
  MessageCircle, 
  Bell, 
  UserRound, 
  FileText, 
  Download,
  Trash2, 
  CheckCheck,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChatUser, ConversationListItem, SelectedConversation } from "./chat-types";
import { UserAvatar, getDisplayName, formatListTime } from "./chat-ui-utils";

type ServerAction = (formData: FormData) => void | Promise<void>;

export function NewMessagePicker({
  contacts,
  query,
  onQueryChange,
  openDirectSessionAction,
  onSelect,
}: {
  contacts: ChatUser[];
  query: string;
  onQueryChange: (value: string) => void;
  openDirectSessionAction: ServerAction;
  onSelect: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-1 pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Compose
        </p>
        <p className="mt-1 text-base font-semibold tracking-tight text-slate-900">
          New message
        </p>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search teammates..."
          className="h-10 rounded-xl border-[#ece6da] bg-[#fbfaf6] pl-9 text-[13px]"
        />
      </div>
      <ScrollArea className="flex-1 -mr-2 pr-2">
        <div className="space-y-1">
          {contacts.map((user) => (
            <form key={user.id} action={openDirectSessionAction} onSubmit={onSelect}>
              <input type="hidden" name="targetUserId" value={user.id} />
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all hover:bg-[#f4f1e8] active:scale-[0.98]"
              >
                <UserAvatar user={user} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-5 text-slate-900">
                    {getDisplayName(user)}
                  </p>
                  <p className="truncate text-[12px] leading-5 text-slate-500">
                    {user.email ?? "Available"}
                  </p>
                </div>
                <Plus className="ml-auto size-4 text-slate-300" />
              </button>
            </form>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function ChatSidebar({
  conversations,
  activeConversation,
  isUserOnline,
  listQuery,
  onListQueryChange,
  newMessageContacts,
  newMessageQuery,
  onNewMessageQueryChange,
  openDirectSessionAction,
  archiveConversationAction,
  markConversationUnreadAction,
  toggleMuteConversationAction,
  clearConversationAction,
  deleteConversationAction,
  onOpenDetails,
  newMessageOpen,
  onNewMessageOpenChange,
}: {
  conversations: ConversationListItem[];
  activeConversation: SelectedConversation | null;
  isUserOnline: (id: string, isAi?: boolean) => boolean;
  listQuery: string;
  onListQueryChange: (v: string) => void;
  newMessageContacts: ChatUser[];
  newMessageQuery: string;
  onNewMessageQueryChange: (v: string) => void;
  openDirectSessionAction: ServerAction;
  archiveConversationAction: ServerAction;
  markConversationUnreadAction: ServerAction;
  toggleMuteConversationAction: ServerAction;
  clearConversationAction: ServerAction;
  deleteConversationAction: ServerAction;
  onOpenDetails: () => void;
  newMessageOpen: boolean;
  onNewMessageOpenChange: (open: boolean) => void;
}) {
  const [isTouchMode, setIsTouchMode] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setIsTouchMode(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <aside className={cn(
      "flex flex-col border-r border-[#ece7dc] bg-[#fbf9f3] px-4 py-6 md:w-[320px] transition-all",
      activeConversation ? "hidden md:flex" : "flex w-full"
    )}>
      <div className="mb-5 flex items-end justify-between gap-3 px-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Inbox
          </p>
          <h2 className="mt-1 text-[1.75rem] font-semibold leading-none tracking-[-0.03em] text-slate-900">
            Messages
          </h2>
        </div>
        <Popover open={newMessageOpen} onOpenChange={onNewMessageOpenChange}>
          <PopoverTrigger asChild>
            <Button size="sm" className="h-9 rounded-xl bg-[#2ea48c] px-4 text-[13px] font-semibold text-white shadow-md hover:bg-[#24937d] active:scale-95 transition-all">
              <PenSquare className="mr-2 size-4" />
              New Message
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" side="bottom" className="w-[300px] rounded-[24px] border-[#ebe5d9] bg-white p-4 shadow-2xl">
            <NewMessagePicker
              contacts={newMessageContacts}
              query={newMessageQuery}
              onQueryChange={onNewMessageQueryChange}
              openDirectSessionAction={openDirectSessionAction}
              onSelect={() => onNewMessageOpenChange(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="mb-5 flex items-center gap-2 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={listQuery}
            onChange={(e) => onListQueryChange(e.target.value)}
            placeholder="Search in message"
            className="h-10 rounded-xl border-[#e9e3d7] bg-white pl-9 text-[13px] focus:bg-[#fbf9f3]"
          />
        </div>
        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-[#e7e2d4] hover:bg-white">
          <Filter className="size-4 text-slate-500" />
        </Button>
      </div>

      <ScrollArea className="flex-1 -mr-2 pr-2">
        <div className="space-y-1">
          {conversations.map((convo) => (
            <SwipeableConversationRow
              key={convo.id}
              conversation={convo}
              activeConversation={activeConversation}
              isOnline={isUserOnline(convo.id, convo.isAi)}
              openDirectSessionAction={openDirectSessionAction}
              archiveConversationAction={archiveConversationAction}
              markConversationUnreadAction={markConversationUnreadAction}
              toggleMuteConversationAction={toggleMuteConversationAction}
              clearConversationAction={clearConversationAction}
              deleteConversationAction={deleteConversationAction}
              isTouchMode={isTouchMode}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}

function SwipeableConversationRow({
  conversation,
  activeConversation,
  isOnline,
  openDirectSessionAction,
  archiveConversationAction,
  markConversationUnreadAction,
  toggleMuteConversationAction,
  clearConversationAction,
  deleteConversationAction,
  isTouchMode,
  onOpenDetails,
}: {
  conversation: ConversationListItem;
  activeConversation: SelectedConversation | null;
  isOnline: boolean;
  openDirectSessionAction: ServerAction;
  archiveConversationAction: ServerAction;
  markConversationUnreadAction: ServerAction;
  toggleMuteConversationAction: ServerAction;
  clearConversationAction: ServerAction;
  deleteConversationAction: ServerAction;
  isTouchMode: boolean;
  onOpenDetails: () => void;
}) {
  const [swipeSide, setSwipeSide] = useState<"left" | "right" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);
  const redirectTo =
    activeConversation ? `/chat?session=${activeConversation.sessionId}` : "/chat";
  const swipeOffset = swipeSide === "left" ? 86 : swipeSide === "right" ? -86 : 0;

  function clearLongPressTimer() {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  useEffect(() => clearLongPressTimer, []);

  function openDesktopMenu() {
    if (isTouchMode) {
      return;
    }

    setSwipeSide(null);
    suppressNextClickRef.current = true;
    setMenuOpen(true);
  }

  return (
    <div className={cn(
      "relative isolate overflow-hidden rounded-[22px] transition-all duration-300",
      conversation.isSelected ? "shadow-xl shadow-slate-200/50" : ""
    )}>
      {isTouchMode ? (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center pl-1.5">
            <form action={markConversationUnreadAction}>
              <input type="hidden" name="sessionId" value={conversation.sessionId} />
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <Button type="submit" className="h-[64px] w-20 rounded-[18px] bg-[#2ea48c] text-xs font-bold text-white hover:bg-[#24937d]">
                Unread
              </Button>
            </form>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
            <form action={archiveConversationAction}>
              <input type="hidden" name="sessionId" value={conversation.sessionId} />
              <Button type="submit" className="h-[64px] w-20 rounded-[18px] bg-[#2ea48c] text-xs font-bold text-white hover:bg-[#24937d]">
                Archive
              </Button>
            </form>
          </div>
        </>
      ) : null}

      <motion.div
        drag={isTouchMode ? "x" : false}
        dragConstraints={{ left: -86, right: 86 }}
        dragElastic={0.06}
        animate={{ x: swipeOffset }}
        transition={{ type: "spring", stiffness: 360, damping: 30 }}
        onDragEnd={(_, info) => {
          if (!isTouchMode) {
            return;
          }

          if (info.offset.x > 40 || info.velocity.x > 260) {
            setSwipeSide("left");
            return;
          }

          if (info.offset.x < -40 || info.velocity.x < -260) {
            setSwipeSide("right");
            return;
          }

          setSwipeSide(null);
        }}
        className="group relative z-10 flex items-center overflow-hidden rounded-[22px] p-1.5 touch-pan-y"
      >
        <Link 
          href={`/chat?session=${conversation.sessionId}`}
          className="flex-1 min-w-0"
        >
          <div
            className={cn(
              "flex w-full items-center gap-3 overflow-hidden rounded-[18px] px-3 py-2.5 text-left transition-colors",
              conversation.isSelected ? "bg-white" : "bg-transparent hover:bg-white/70"
            )}
            onPointerDown={(event) => {
              if (isTouchMode || event.button !== 0) {
                return;
              }
 
              clearLongPressTimer();
              longPressTimerRef.current = window.setTimeout(() => {
                openDesktopMenu();
              }, 380);
            }}
            onPointerUp={clearLongPressTimer}
            onPointerLeave={clearLongPressTimer}
            onPointerCancel={clearLongPressTimer}
            onContextMenu={(event) => {
              if (isTouchMode) {
                return;
              }
 
              event.preventDefault();
              clearLongPressTimer();
              openDesktopMenu();
            }}
            onClick={(event) => {
              clearLongPressTimer();
 
              if (!isTouchMode && (event.altKey || suppressNextClickRef.current)) {
                event.preventDefault();
                event.stopPropagation();
                suppressNextClickRef.current = false;
                setMenuOpen(true);
                return;
              }
 
              if (swipeSide) {
                event.preventDefault();
                setSwipeSide(null);
              }
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full">
              <UserAvatar
                user={conversation}
                className="h-10 w-10"
                showStatus
                isOnline={isOnline}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13px] font-semibold leading-5 text-slate-900">
                  {getDisplayName(conversation)}
                </p>
                <span className="shrink-0 text-[10px] font-medium tracking-[0.01em] text-slate-400">
                  {formatListTime(conversation.latestAt)}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                {conversation.unreadCount > 0 && (
                  <Badge className="h-4 min-w-4 rounded-full bg-[#2ea48c] px-1 text-[9px] font-semibold text-white shadow-none">
                    {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                  </Badge>
                )}
                <p className={cn(
                  "flex-1 truncate text-[12px] leading-5",
                  conversation.unreadCount > 0 ? "font-medium text-slate-700" : "text-slate-400"
                )}>
                  {conversation.latestMessage || "Start chatting..."}
                </p>
                <CheckCheck className={cn("size-3.5", conversation.unreadCount > 0 ? "text-slate-200" : "text-[#2ea48c]/40")} />
              </div>
            </div>
          </div>
        </Link>

        <DropdownMenu
          open={menuOpen}
          onOpenChange={(open) => {
            if (open) {
              setSwipeSide(null);
            }

            setMenuOpen(open);
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn(
              "h-8 w-8 rounded-xl transition-opacity hover:bg-slate-100",
              conversation.isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
               <MoreHorizontal className="size-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" sideOffset={8} className="w-56 rounded-[20px] border-[#efeadf] p-2 shadow-xl">
             <form action={markConversationUnreadAction}>
               <input type="hidden" name="sessionId" value={conversation.sessionId} />
               <input type="hidden" name="redirectTo" value={redirectTo} />
               <DropdownMenuItem asChild className="rounded-xl">
                 <button className="flex w-full items-center"><MessageCircle className="mr-2 size-4" /> Mark as unread</button>
               </DropdownMenuItem>
             </form>
             <form action={archiveConversationAction}>
               <input type="hidden" name="sessionId" value={conversation.sessionId} />
               <DropdownMenuItem asChild className="rounded-xl">
                 <button className="flex w-full items-center"><Archive className="mr-2 size-4" /> Archive</button>
               </DropdownMenuItem>
             </form>
             <DropdownMenuSub>
               <DropdownMenuSubTrigger className="rounded-xl">
                 <Bell className="mr-2 size-4" />
                 Mute
               </DropdownMenuSubTrigger>
               <DropdownMenuSubContent className="w-48 rounded-2xl border-[#efeadf] p-2 shadow-xl">
                 <form action={toggleMuteConversationAction}>
                   <input type="hidden" name="sessionId" value={conversation.sessionId} />
                   <input type="hidden" name="redirectTo" value={redirectTo} />
                   <DropdownMenuItem asChild className="rounded-xl">
                     <button className="flex w-full items-center">
                       <Bell className="mr-2 size-4" />
                       {conversation.isMuted ? "Unmute conversation" : "Mute conversation"}
                     </button>
                   </DropdownMenuItem>
                 </form>
               </DropdownMenuSubContent>
             </DropdownMenuSub>
             <DropdownMenuItem className="rounded-xl" onSelect={onOpenDetails}>
               <UserRound className="mr-2 size-4" />
               Contact Info
             </DropdownMenuItem>
             <DropdownMenuItem className="rounded-xl">
               <Download className="mr-2 size-4" />
               Export chat
             </DropdownMenuItem>
             <form action={clearConversationAction}>
               <input type="hidden" name="sessionId" value={conversation.sessionId} />
               <DropdownMenuItem asChild className="rounded-xl">
                 <button className="flex w-full items-center"><FileText className="mr-2 size-4" /> Clear chat</button>
               </DropdownMenuItem>
             </form>
             <DropdownMenuSeparator />
             <form action={deleteConversationAction}>
               <input type="hidden" name="sessionId" value={conversation.sessionId} />
               <DropdownMenuItem asChild className="rounded-xl text-red-600 focus:text-red-600 focus:bg-red-50">
                 <button className="flex w-full items-center"><Trash2 className="mr-2 size-4" /> Delete chat</button>
               </DropdownMenuItem>
             </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </div>
  );
}
