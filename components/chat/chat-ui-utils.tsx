"use client";

import { cn } from "@/lib/utils";
import { ChatUser } from "./chat-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function getDisplayName(user: ChatUser) {
  return user.name ?? user.email ?? "Unknown contact";
}

export function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "SC";
  const [first = "", second = ""] = source.split(/\s+/);

  return `${first.charAt(0)}${second.charAt(0) || first.charAt(1) || ""}`
    .toUpperCase()
    .slice(0, 2);
}

export function formatListTime(value: string | null) {
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

export function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date());
}

export function getDocTone(extension: string) {
  if (extension === "PDF") return "bg-red-50 text-red-500";
  if (extension === "FIG") return "bg-violet-50 text-violet-500";
  if (extension === "AI") return "bg-orange-50 text-orange-500";

  return "bg-slate-100 text-slate-500";
}

export function UserAvatar({
  user,
  className,
  showStatus = false,
  isOnline = false,
  size = "lg",
}: {
  user: ChatUser;
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  size?: "sm" | "default" | "lg" | "md";
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    md: "h-10 w-10",
    lg: "h-11 w-11",
  };

  return (
    <div className="relative shrink-0">
      <Avatar
        size={size === "md" ? "default" : size}
        className={cn(
          sizeClasses[size],
          "rounded-full ring-1 ring-black/5 [&_[data-slot=avatar-fallback]]:bg-[#38a58d] [&_[data-slot=avatar-fallback]]:font-medium [&_[data-slot=avatar-fallback]]:text-white",
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
