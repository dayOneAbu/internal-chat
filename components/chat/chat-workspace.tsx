"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  CircleDot,
  Ellipsis,
  FileText,
  Filter,
  Folder,
  Home,
  Link2,
  MessageCircle,
  Mic,
  MoonStar,
  MoreHorizontal,
  Paperclip,
  PenSquare,
  Phone,
  Plus,
  Search,
  SendHorizonal,
  Settings2,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ServerAction = (formData: FormData) => void | Promise<void>;

type ChatUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  isAi: boolean;
};

type ConversationListItem = ChatUser & {
  latestMessage: string | null;
  latestAt: string | null;
  isSelected: boolean;
  isOnline: boolean;
  isUnread: boolean;
};

type MessageItem = {
  id: string;
  senderId: string;
  senderName: string | null;
  senderEmail: string | null;
  content: string;
  createdAt: string;
  isAi: boolean;
};

type SelectedConversation = {
  sessionId: string;
  peer: ChatUser & {
    isOnline: boolean;
  };
  messages: MessageItem[];
};

type ChatWorkspaceProps = {
  currentUser: ChatUser;
  conversations: ConversationListItem[];
  selectedConversation: SelectedConversation | null;
  openDirectSessionAction: ServerAction;
  sendMessageAction: ServerAction;
  signOutAction: ServerAction;
};

const mediaGroups = [
  {
    month: "May",
    items: [
      "from-fuchsia-500 via-violet-500 to-cyan-300",
      "from-slate-950 via-cyan-800 to-rose-500",
      "from-slate-100 via-slate-200 to-slate-300",
      "from-rose-500 via-red-300 to-slate-700",
      "from-violet-600 via-fuchsia-500 to-slate-900",
      "from-orange-300 via-amber-400 to-slate-100",
      "from-pink-500 via-fuchsia-400 to-cyan-100",
    ],
  },
  {
    month: "April",
    items: [
      "from-cyan-500 via-fuchsia-600 to-orange-500",
      "from-pink-200 via-sky-200 to-fuchsia-400",
      "from-cyan-100 via-sky-400 to-slate-100",
      "from-amber-100 via-rose-100 to-white",
      "from-orange-500 via-pink-500 to-amber-200",
    ],
  },
  {
    month: "March",
    items: [
      "from-zinc-200 via-zinc-100 to-white",
      "from-amber-100 via-blue-100 to-orange-400",
      "from-slate-800 via-orange-500 to-sky-300",
      "from-zinc-900 via-slate-700 to-zinc-950",
    ],
  },
];

const sharedLinks = [
  {
    name: "https://basecamp.net/",
    description:
      "Discover thousands of premium UI kits, templates, and design resources.",
    accent: "bg-slate-900 text-white",
  },
  {
    name: "https://notion.com/",
    description: "A new tool that blends your everyday work apps into one.",
    accent: "bg-white text-black border border-slate-200",
  },
  {
    name: "https://asana.com/",
    description:
      "Work anytime, anywhere with focused project and workflow tracking.",
    accent: "bg-rose-500 text-white",
  },
  {
    name: "https://trello.com/",
    description:
      "Make the impossible possible with a clean task board for the team.",
    accent: "bg-sky-500 text-white",
  },
];

const sharedDocs = [
  {
    name: "Document Requirement.pdf",
    meta: "10 pages • 16 MB • pdf",
    tone: "bg-red-50 text-red-500",
    short: "PDF",
  },
  {
    name: "User Flow.pdf",
    meta: "7 pages • 32 MB • pdf",
    tone: "bg-red-50 text-red-500",
    short: "PDF",
  },
  {
    name: "Existing App.fig",
    meta: "213 MB • fig",
    tone: "bg-violet-50 text-violet-500",
    short: "FIG",
  },
  {
    name: "Product Illustrations.ai",
    meta: "72 MB • ai",
    tone: "bg-orange-50 text-orange-500",
    short: "AI",
  },
];

function getDisplayName(user: ChatUser) {
  return user.name ?? user.email ?? "Unknown contact";
}

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "SC";
  const [first = "", second = ""] = source.split(/\s+/);

  return `${first.charAt(0)}${second.charAt(0) || first.charAt(1) || ""}`
    .toUpperCase()
    .slice(0, 2);
}

function formatListTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / (1000 * 60))
  );

  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function UserAvatar({
  user,
  className,
  showStatus = false,
  isOnline = false,
}: {
  user: ChatUser;
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
}) {
  return (
    <div className="relative shrink-0">
      <Avatar
        size="lg"
        className={cn(
          "h-11 w-11 rounded-full ring-1 ring-black/5 [&_[data-slot=avatar-fallback]]:bg-[#38a58d] [&_[data-slot=avatar-fallback]]:font-medium [&_[data-slot=avatar-fallback]]:text-white",
          className
        )}
      >
        {user.avatarUrl ? (
          <AvatarImage src={user.avatarUrl} alt={getDisplayName(user)} />
        ) : null}
        <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
      </Avatar>
      {showStatus ? (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#fbf9f3]",
            isOnline ? "bg-[#34b88e]" : "bg-slate-300"
          )}
        />
      ) : null}
    </div>
  );
}

function ContactInfoContent({
  conversation,
  onClose,
}: {
  conversation: SelectedConversation | null;
  onClose?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"media" | "link" | "docs">(
    "media"
  );

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-7 text-slate-400">
        Open a conversation to see contact details, shared media, and documents.
      </div>
    );
  }

  return (
    <div key={conversation.sessionId} className="flex h-full flex-col">
      <div className="border-b border-[#ece8dc] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <SheetTitle className="text-left text-[1.65rem] font-semibold tracking-tight text-slate-900">
              Contact Info
            </SheetTitle>
            <SheetDescription className="mt-1 text-left text-sm text-slate-400">
              Shared context for this thread.
            </SheetDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden h-9 w-9 rounded-xl text-slate-400 hover:bg-[#f3efe5] hover:text-slate-700 xl:inline-flex"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-7 flex flex-col items-center text-center">
          <UserAvatar user={conversation.peer} className="h-16 w-16" />
          <p className="mt-4 text-xl font-semibold text-slate-900">
            {getDisplayName(conversation.peer)}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {conversation.peer.email ?? "No email"}
          </p>

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-[#e7e2d4] bg-white text-slate-700"
            >
              <Phone className="size-4" />
              Audio
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-[#e7e2d4] bg-white text-slate-700"
            >
              <Video className="size-4" />
              Video
            </Button>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 py-5">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "media" | "link" | "docs")}
          className="min-h-0 flex-1"
        >
          <TabsList className="mb-4 h-auto rounded-full bg-[#f3f0e6] p-1">
            <TabsTrigger value="media" className="rounded-full px-4">
              Media
            </TabsTrigger>
            <TabsTrigger value="link" className="rounded-full px-4">
              Link
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-full px-4">
              Docs
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-18rem)] pr-2">
            {activeTab === "media" ? (
              <div className="space-y-5">
                {mediaGroups.map((group) => (
                  <div key={group.month}>
                    <div className="mb-3 rounded-xl bg-[#f4f0e6] px-3 py-2 text-xs font-medium text-slate-500">
                      {group.month}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {group.items.map((item, index) => (
                        <div
                          key={`${group.month}-${index}`}
                          className={cn(
                            "aspect-square rounded-2xl bg-gradient-to-br",
                            item
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "link" ? (
              <div className="space-y-3">
                {sharedLinks.map((item) => (
                  <Card
                    key={item.name}
                    className="gap-0 rounded-2xl border-[#ece8dc] bg-white py-0 shadow-none"
                  >
                    <CardContent className="flex items-start gap-3 px-4 py-4">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
                          item.accent
                        )}
                      >
                        <Link2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}

            {activeTab === "docs" ? (
              <div className="space-y-3">
                {sharedDocs.map((item) => (
                  <Card
                    key={item.name}
                    className="gap-0 rounded-2xl border-[#ece8dc] bg-white py-0 shadow-none"
                  >
                    <CardContent className="flex items-start gap-3 px-4 py-4">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold",
                          item.tone
                        )}
                      >
                        {item.short}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.meta}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

export function ChatWorkspace({
  currentUser,
  conversations,
  selectedConversation,
  openDirectSessionAction,
  sendMessageAction,
  signOutAction,
}: ChatWorkspaceProps) {
  const [detailsOpen, setDetailsOpen] = useState(Boolean(selectedConversation));
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const [newMessageQuery, setNewMessageQuery] = useState("");

  const filteredConversations = useMemo(() => {
    const query = listQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const haystack = [
        conversation.name,
        conversation.email,
        conversation.latestMessage,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [conversations, listQuery]);

  const newMessageContacts = useMemo(() => {
    const query = newMessageQuery.trim().toLowerCase();

    if (!query) return conversations;

    return conversations.filter((conversation) => {
      return [conversation.name, conversation.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [conversations, newMessageQuery]);

  return (
    <main className="min-h-screen bg-[#fbf9f3] text-slate-900">
      <div className="flex min-h-screen overflow-hidden bg-[#fbf9f3]">
        <aside className="hidden w-[72px] flex-col justify-between border-r border-[#ece7dc] bg-[#f9f7f1] py-4 md:flex">
          <div className="space-y-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2ea48c] text-white shadow-[0_12px_30px_rgba(46,164,140,0.25)]">
                  <Sparkles className="size-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="right"
                className="w-60 rounded-2xl border-[#e8e2d5] p-2"
              >
                <DropdownMenuItem asChild>
                  <Link href="/" className="rounded-xl">
                    <ChevronDown className="size-4 rotate-90" />
                    Go back to dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl">
                  <PenSquare className="size-4" />
                  Rename file
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="rounded-2xl bg-[#f7f4eb] px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {currentUser.name ?? "ShipChat workspace"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {currentUser.email ?? "Local mode"}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3 text-sm">
                    <div>
                      <p className="text-slate-400">Credits</p>
                      <p className="font-semibold text-slate-900">20 left</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Renews in</p>
                      <p className="font-semibold text-slate-900">6h 24m</p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-xl">
                  <Star className="size-4" />
                  Win free credits
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-xl">
                  <MoonStar className="size-4" />
                  Theme Style
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <Settings2 className="size-4" />
                    Log out
                  </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="space-y-3">
              {[
                { icon: Home, active: false },
                { icon: MessageCircle, active: true },
                { icon: CircleDot, active: false },
                { icon: Folder, active: false },
                { icon: PenSquare, active: false },
              ].map(({ icon: Icon, active }, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    "mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white hover:text-slate-900",
                    active &&
                      "border border-[#7ad2bd] bg-[#e7faf4] text-[#2ea48c]"
                  )}
                >
                  <Icon className="size-4.5" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <Plus className="size-4" />
            </button>
            <button
              type="button"
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white hover:text-slate-900"
            >
              <Star className="size-4" />
            </button>
            <div className="mx-auto">
              <UserAvatar user={currentUser} className="h-11 w-11" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[74px] items-center justify-between gap-5 border-b border-[#ece7dc] px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Search className="size-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Message</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden items-center rounded-xl border border-[#ebe6da] bg-white px-3 py-2 md:flex">
                <Search className="pointer-events-none absolute left-3 size-4 text-slate-400" />
                <Input
                  placeholder="Search"
                  className="h-auto w-48 border-0 bg-transparent py-0 pl-7 shadow-none focus-visible:ring-0"
                />
              </div>
              <Badge
                variant="outline"
                className="hidden rounded-lg border-[#ebe6da] bg-white px-2.5 py-1 text-xs text-slate-500 md:inline-flex"
              >
                ⌘ K
              </Badge>
              {[Bell, Settings2].map((Icon, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-xl border-[#ebe6da] bg-white text-slate-500 shadow-none hover:bg-[#f7f4ed]"
                >
                  <Icon className="size-4" />
                </Button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-1 flex items-center gap-2 rounded-xl bg-white px-2 py-1.5">
                    <UserAvatar user={currentUser} className="h-9 w-9" />
                    <ChevronDown className="hidden size-4 text-slate-400 md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 rounded-2xl border-[#e8e2d5] p-2"
                >
                  <DropdownMenuItem className="rounded-xl">
                    <UserRound className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl">
                    <Settings2 className="size-4" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-accent"
                    >
                      <Settings2 className="size-4" />
                      Log out
                    </button>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <aside className="w-[320px] shrink-0 border-r border-[#ece7dc] bg-[#f9f7f1] px-4 py-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">
                    All Message
                  </h2>
                </div>

                <Popover open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      className="h-10 rounded-xl bg-[#2ea48c] px-4 text-white hover:bg-[#24937d]"
                    >
                      <PenSquare className="size-4" />
                      New Message
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[300px] rounded-3xl border-[#ebe5d9] bg-white p-3 shadow-[0_20px_50px_rgba(91,84,60,0.12)]"
                  >
                    <p className="px-1 pb-3 text-lg font-semibold text-slate-900">
                      New Message
                    </p>
                    <Input
                      value={newMessageQuery}
                      onChange={(event) => setNewMessageQuery(event.target.value)}
                      placeholder="Search name or email"
                      className="h-11 rounded-xl border-[#ece6da] bg-[#fbfaf6]"
                    />
                    <ScrollArea className="mt-3 h-64 pr-2">
                      <div className="space-y-1">
                        {newMessageContacts.map((conversation) => (
                          <form
                            key={conversation.id}
                            action={openDirectSessionAction}
                            onSubmit={() => setNewMessageOpen(false)}
                          >
                            <input
                              type="hidden"
                              name="targetUserId"
                              value={conversation.id}
                            />
                            <button
                              type="submit"
                              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-[#f4f1e8]"
                            >
                              <UserAvatar user={conversation} className="h-10 w-10" />
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {getDisplayName(conversation)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {conversation.email ?? "Start a new thread"}
                                </p>
                              </div>
                            </button>
                          </form>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="mb-4 flex items-center gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={listQuery}
                    onChange={(event) => setListQuery(event.target.value)}
                    placeholder="Search in message"
                    className="h-11 rounded-xl border-[#e9e3d7] bg-white pl-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-[#e9e3d7] bg-white text-slate-500 shadow-none"
                >
                  <Filter className="size-4" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-13rem)] pr-2">
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-2xl p-1 transition-colors",
                        conversation.isSelected && "bg-white shadow-sm"
                      )}
                    >
                      <form action={openDirectSessionAction} className="min-w-0 flex-1">
                        <input
                          type="hidden"
                          name="targetUserId"
                          value={conversation.id}
                        />
                        <button
                          type="submit"
                          className="flex w-full min-w-0 items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left transition-colors hover:bg-white"
                        >
                          <UserAvatar
                            user={conversation}
                            className="h-10 w-10"
                            showStatus
                            isOnline={conversation.isOnline}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {getDisplayName(conversation)}
                              </p>
                              <span className="shrink-0 text-xs text-slate-400">
                                {formatListTime(conversation.latestAt)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              {conversation.isUnread ? (
                                <Badge className="rounded-xl bg-[#2ea48c] px-2.5 py-1 text-[10px] font-medium text-white shadow-none">
                                  Unread
                                </Badge>
                              ) : null}
                              {conversation.latestMessage ? (
                                <p className="truncate text-sm text-slate-400">
                                  {conversation.latestMessage}
                                </p>
                              ) : (
                                <p className="truncate text-sm text-slate-300">
                                  Start a conversation
                                </p>
                              )}
                              <CheckCheck className="ml-auto size-3.5 shrink-0 text-slate-300" />
                            </div>
                          </div>
                        </button>
                      </form>

                      {conversation.isSelected ? (
                        <Button
                          type="button"
                          className="hidden h-[78px] rounded-[1.1rem] bg-[#2ea48c] px-3 text-white hover:bg-[#24937d] group-hover:inline-flex"
                        >
                          Archive
                        </Button>
                      ) : null}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-slate-700 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-52 rounded-2xl border-[#e8e2d5] p-2"
                        >
                          <DropdownMenuItem className="rounded-xl">
                            <MessageCircle className="size-4" />
                            Mark as unread
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl">
                            <Folder className="size-4" />
                            Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl">
                            <Bell className="size-4" />
                            Mute
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl"
                            onSelect={() => setDetailsOpen(true)}
                          >
                            <UserRound className="size-4" />
                            Contact info
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl">
                            <FileText className="size-4" />
                            Export chat
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-xl">
                            <Trash2 className="size-4" />
                            Clear chat
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            className="rounded-xl"
                          >
                            <Trash2 className="size-4" />
                            Delete chat
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </aside>

            <section className="flex min-w-0 flex-1 flex-col bg-[#fdfbf5]">
              {selectedConversation ? (
                <>
                  <div className="flex h-[74px] items-center justify-between border-b border-[#ece7dc] px-4 md:px-6">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={selectedConversation.peer}
                        showStatus
                        isOnline={selectedConversation.peer.isOnline}
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {getDisplayName(selectedConversation.peer)}
                        </p>
                        <p className="text-xs text-[#34b88e]">
                          {selectedConversation.peer.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {[Search, Phone, Video].map((Icon, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-10 w-10 rounded-xl border-[#e9e3d8] bg-white text-slate-500 shadow-none"
                        >
                          <Icon className="size-4" />
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-xl border-[#e9e3d8] bg-white text-slate-500 shadow-none"
                        onClick={() => setDetailsOpen((open) => !open)}
                      >
                        <Ellipsis className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex min-h-0 flex-1">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <ScrollArea className="h-[calc(100vh-13rem)]">
                        <div className="min-h-full bg-[#f6f3ea] px-4 py-6 md:px-6">
                          <div className="mb-6 flex justify-center">
                            <Badge className="rounded-full bg-white px-3 py-1 text-xs text-slate-500 shadow-none">
                              Today
                            </Badge>
                          </div>

                          <div className="space-y-5">
                            {selectedConversation.messages.map((message) => {
                              const isCurrentUser =
                                message.senderId === currentUser.id;

                              return (
                                <div
                                  key={message.id}
                                  className={cn(
                                    "flex",
                                    isCurrentUser
                                      ? "justify-end"
                                      : "justify-start"
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "max-w-[28rem]",
                                      isCurrentUser && "items-end"
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "rounded-[1.15rem] px-4 py-3 text-sm leading-7 shadow-sm",
                                        isCurrentUser
                                          ? "rounded-br-md bg-[#ecfff8] text-slate-700"
                                          : "rounded-bl-md bg-white text-slate-700"
                                      )}
                                    >
                                      {message.content}
                                    </div>
                                    <div
                                      className={cn(
                                        "mt-2 flex items-center gap-2 text-xs text-slate-400",
                                        isCurrentUser && "justify-end"
                                      )}
                                    >
                                      {isCurrentUser ? (
                                        <CheckCheck className="size-3.5 text-[#69c6a8]" />
                                      ) : null}
                                      <span>{formatMessageTime(message.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </ScrollArea>

                      <div className="border-t border-[#ece7dc] bg-white px-4 py-3 md:px-6">
                        <form action={sendMessageAction}>
                          <input
                            type="hidden"
                            name="sessionId"
                            value={selectedConversation.sessionId}
                          />
                          <Card className="gap-0 rounded-[1.5rem] border-[#ece6db] bg-[#fdfbf6] py-0 shadow-none">
                            <CardContent className="px-4 py-3">
                              <Textarea
                                name="content"
                                placeholder="Type any message..."
                                rows={2}
                                required
                                className="min-h-[54px] resize-none border-0 bg-transparent px-0 py-1 text-sm leading-7 text-slate-700 shadow-none focus-visible:ring-0"
                              />
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-slate-400">
                                  {[Mic, CircleDot, Paperclip].map((Icon, index) => (
                                    <Button
                                      key={index}
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 rounded-full text-slate-400 hover:bg-[#f3efe5]"
                                    >
                                      <Icon className="size-4" />
                                    </Button>
                                  ))}
                                </div>
                                <Button
                                  type="submit"
                                  size="icon"
                                  className="h-10 w-10 rounded-full bg-[#2ea48c] text-white hover:bg-[#24937d]"
                                >
                                  <SendHorizonal className="size-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </form>
                      </div>
                    </div>

                    {detailsOpen ? (
                      <aside className="hidden w-[340px] shrink-0 border-l border-[#ece7dc] bg-white xl:block">
                        <ContactInfoContent
                          conversation={selectedConversation}
                          onClose={() => setDetailsOpen(false)}
                        />
                      </aside>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center px-6">
                  <div className="max-w-md text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcf5ee] text-[#2ea48c]">
                      <MessageCircle className="size-7" />
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold text-slate-900">
                      Open a conversation
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Pick a teammate from the message list or start a new thread
                      to load the full workspace view.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="w-[92vw] max-w-[360px] border-l-[#ece7dc] bg-white p-0 xl:hidden"
        >
          <ContactInfoContent
            conversation={selectedConversation}
            onClose={() => setDetailsOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </main>
  );
}
