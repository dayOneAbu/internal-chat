"use client";

import Link from "next/link";
import { 
  Home, 
  MessageCircle, 
  CircleDot, 
  Folder, 
  PenSquare, 
  Star, 
  Gift,
  LogOut,
  Palette,
  ChevronLeft
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChatUser } from "./chat-types";
import { UserAvatar } from "./chat-ui-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShipChatMark } from "@/components/brand/shipchat-logo";

function HoverHint({
  children,
  label,
  description,
  side = "right",
}: {
  children: React.ReactNode;
  label: string;
  description?: string;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align="center" className="z-50">
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900">{label}</p>
          {description && (
            <p className="max-w-44 text-[11px] leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function WorkspaceNavigation({
  currentUser,
  totalUnreadCount,
  signOutAction,
}: {
  currentUser: ChatUser;
  totalUnreadCount: number;
  signOutAction: (formData: FormData) => void;
}) {
  const navItems = [
    { icon: Home, label: "Home", active: false, description: "Workspace overview" },
    { icon: MessageCircle, label: "Messages", active: true, description: "Live conversations", badge: totalUnreadCount },
    { icon: CircleDot, label: "Activity", active: false, description: "Recent updates" },
    { icon: Folder, label: "Files", active: false, description: "Shared attachments" },
    { icon: PenSquare, label: "Notes", active: false, description: "Quick drafts" },
  ];

  return (
    <aside className="hidden h-full w-[72px] flex-col justify-between border-r border-[#ece7dc] bg-[#faf8f2] py-6 md:flex">
      <div className="flex flex-col items-center gap-8">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group relative transition-all hover:scale-105 active:scale-95">
              <ShipChatMark
                className="size-12 transition-all group-hover:shadow-[0_20px_40px_rgba(46,164,140,0.28)]"
                iconClassName="size-6"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" sideOffset={10} className="w-[232px] rounded-[22px] border-[#ebe4d8] p-2 shadow-[0_24px_60px_rgba(70,59,37,0.14)]">
              <DropdownMenuItem asChild className="rounded-xl px-3 py-2.5 font-medium">
                <Link href="/">
                  <ChevronLeft className="mr-2 size-4" />
                  Go back to dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-medium">
                <PenSquare className="mr-2 size-4" />
                Rename file
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-0 my-2 bg-[#efe8dd]" />
              <div className="rounded-[18px] bg-[#f7f4ec] px-3 py-3.5">
                 <p className="text-sm font-semibold text-slate-900">{currentUser.name || "Workspace"}</p>
                 <p className="mt-0.5 text-[11px] text-slate-400">{currentUser.email}</p>
                 <div className="mt-4 flex items-start justify-between text-xs text-slate-400">
                   <div>
                     <p>Credits</p>
                     <p className="mt-1 text-base font-semibold text-slate-900">20 left</p>
                   </div>
                   <div className="text-right">
                     <p>Renews in</p>
                     <p className="mt-1 text-base font-semibold text-slate-900">6h 24m</p>
                   </div>
                 </div>
                 <div className="mt-3 h-2 rounded-full bg-white">
                   <div className="h-full w-[46%] rounded-full bg-[#2ea48c]" />
                 </div>
                 <div className="mt-2 flex items-center justify-between text-[11px]">
                   <span className="text-slate-400">5 of 25 used today</span>
                   <span className="font-medium text-[#2ea48c]">+25 tomorrow</span>
                 </div>
              </div>
              <DropdownMenuSeparator className="mx-0 my-2 bg-[#efe8dd]" />
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-medium">
                <Gift className="mr-2 size-4" />
                Win free credits
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-3 py-2.5 font-medium">
                <Palette className="mr-2 size-4" />
                Theme Style
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-0 my-2 bg-[#efe8dd]" />
              <form action={signOutAction}>
                <button type="submit" className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-[#f7f4ec]">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </button>
              </form>
          </DropdownMenuContent>
        </DropdownMenu>

        <nav className="flex flex-col gap-4">
          <TooltipProvider delayDuration={0}>
          {navItems.map((item, idx) => (
            <HoverHint key={idx} label={item.label} description={item.description}>
              <div className="relative">
                <button className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200",
                  item.active 
                    ? "bg-[#2ea48c] text-white shadow-lg shadow-[#2ea48c]/20" 
                    : "text-slate-400 hover:bg-white hover:text-slate-900"
                )}>
                  <item.icon className="size-5" />
                </button>
                {item.badge ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#faf8f2]">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </div>
            </HoverHint>
          ))}
          </TooltipProvider>
        </nav>
      </div>

      <div className="flex flex-col items-center gap-5">
        <button className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 hover:bg-white hover:text-slate-900 transition-colors">
          <Star className="size-5" />
        </button>
        <UserAvatar user={currentUser} className="h-11 w-11 shadow-sm border-2 border-white" />
      </div>
    </aside>
  );
}
