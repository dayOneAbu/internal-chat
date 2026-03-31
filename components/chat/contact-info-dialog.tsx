"use client";

import { useEffect, useState } from "react";
import { Phone, Video, Link2, X } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SelectedConversation } from "./chat-types";
import { UserAvatar, getDisplayName } from "./chat-ui-utils";

export function ContactInfoDialog({
  conversation,
  open,
  onOpenChange,
}: {
  conversation: SelectedConversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState<"media" | "link" | "docs">("media");

  useEffect(() => {
    setActiveTab("media");
  }, [conversation?.sessionId]);

  if (!conversation) return null;

  const mediaContent = conversation.sharedMedia;
  const linkContent = conversation.sharedLinks;
  const docsContent = conversation.sharedDocs;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="pointer-events-none bg-transparent xl:bg-black/5"
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="left-auto right-0 top-0 h-screen w-[min(92vw,380px)] max-w-none translate-x-0 translate-y-0 gap-0 rounded-none rounded-l-[28px] border-y-0 border-r-0 border-l-[#efeadf] bg-white p-0 shadow-2xl duration-300 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full sm:right-4 sm:top-4 sm:h-[calc(100vh-32px)] sm:rounded-[28px]"
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-[#efeadf] px-6 py-6 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-left text-2xl font-bold tracking-tight text-slate-900">
                  Contact Info
                </DialogTitle>
                <DialogDescription className="mt-1 text-left text-sm text-slate-400">
                  Shared context and media
                </DialogDescription>
              </div>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-2xl text-slate-400 hover:bg-[#f3efe5] hover:text-slate-700"
                >
                  <X className="size-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="mt-8 flex flex-col items-center text-center">
              <UserAvatar user={conversation.peer} className="h-20 w-20 shadow-sm" />
              <p className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                {getDisplayName(conversation.peer)}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {conversation.peer.email ?? "No email provided"}
              </p>

              <div className="mt-8 grid w-full grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-[#e7e2d4] bg-white text-slate-700 shadow-none hover:bg-[#fbf9f3] active:scale-95 transition-all"
                >
                  <Phone className="mr-2 size-4" />
                  Audio
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-[#e7e2d4] bg-white text-slate-700 shadow-none hover:bg-[#fbf9f3] active:scale-95 transition-all"
                >
                  <Video className="mr-2 size-4" />
                  Video
                </Button>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "media" | "link" | "docs")
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="mb-6 h-auto w-fit justify-start gap-1 rounded-full bg-[#f3f0e6] p-1.5 self-center">
                <TabsTrigger value="media" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  Media
                </TabsTrigger>
                <TabsTrigger value="link" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  Link
                </TabsTrigger>
                <TabsTrigger value="docs" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm">
                  Docs
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="min-h-0 flex-1 -mr-2 pr-2">
                {activeTab === "media" && (
                  <div className="space-y-6">
                    {mediaContent.length > 0 ? (
                      mediaContent.map((group) => (
                        <div key={group.month}>
                          <div className="mb-4 rounded-xl bg-[#f4f0e6]/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500/80">
                            {group.month}
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            {group.items.map((item, index) => (
                              <div
                                key={`${group.month}-${index}`}
                                className={cn(
                                  "relative aspect-square overflow-hidden rounded-2xl border border-black/5 shadow-sm group cursor-pointer",
                                  !item.fileUrl && (item.tone ?? "bg-slate-100")
                                )}
                              >
                                {item.fileUrl && (
                                  <Image
                                    src={item.fileUrl}
                                    alt="Media asset"
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState message="No shared media yet" />
                    )}
                  </div>
                )}

                {activeTab === "link" && (
                  <div className="space-y-3">
                    {linkContent.length > 0 ? (
                      linkContent.map((item, idx) => (
                        <Card key={idx} className="overflow-hidden rounded-2xl border-[#ece8dc] bg-white transition-all hover:border-[#d4cfc1] hover:shadow-md cursor-pointer group">
                          <CardContent className="flex items-start gap-4 p-4">
                            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors group-hover:bg-opacity-80", item.accent ?? "bg-slate-100")}>
                              <Link2 className="size-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-slate-900">
                                {item.title ?? item.url}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                                {item.description ?? item.url}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <EmptyState message="No shared links yet" />
                    )}
                  </div>
                )}

                {activeTab === "docs" && (
                  <div className="space-y-3">
                    {docsContent.length > 0 ? (
                      docsContent.map((item, idx) => (
                        <Card key={idx} className="overflow-hidden rounded-2xl border-[#ece8dc] bg-white transition-all hover:border-[#d4cfc1] hover:shadow-md cursor-pointer group">
                          <CardContent className="flex items-start gap-4 p-4">
                            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all group-hover:scale-105", item.tone ?? "bg-slate-100")}>
                              {item.short}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-bold text-slate-900">
                                {item.name}
                              </p>
                              <p className="mt-1 text-[11px] text-slate-500">
                                {item.meta}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <EmptyState message="No shared documents yet" />
                    )}
                  </div>
                )}
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-2 text-center opacity-40">
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}
