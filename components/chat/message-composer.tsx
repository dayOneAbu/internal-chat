"use client";

import { useEffect, useRef, useState } from "react";
import {
  Smile,
  Paperclip,
  SendHorizonal,
  X,
  Link2,
  FileText,
  Mic,
  ImageUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SharedLinkItem, SharedDocItem } from "./chat-types";
import { UploadedAssetItem } from "@/lib/chat-shared-assets";
import { getDocTone } from "./chat-ui-utils";
import { SmartReplies } from "./smart-replies";

type ServerAction = (formData: FormData) => void | Promise<void>;

export function MessageComposer({
  isAiSession,
  sessionId,
  sendMessageAction,
  onAwaitingAiReplyChange,
  onTypingStateChange,
}: {
  isAiSession: boolean;
  sessionId: string;
  sendMessageAction: ServerAction;
  onAwaitingAiReplyChange?: (pending: boolean) => void;
  onTypingStateChange?: (state: "active" | "idle") => void;
}) {
  const [draftMessage, setDraftMessage] = useState("");
  const [attachmentOpen, setAttachmentOpen] = useState(false);
  const [draftLinks, setDraftLinks] = useState<SharedLinkItem[]>([]);
  const [draftDocs, setDraftDocs] = useState<SharedDocItem[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<UploadedAssetItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingStateRef = useRef<"active" | "idle">("idle");

  const [pendingLinkUrl, setPendingLinkUrl] = useState("");
  const [pendingLinkTitle, setPendingLinkTitle] = useState("");
  const [pendingDocName, setPendingDocName] = useState("");
  const [pendingDocMeta, setPendingDocMeta] = useState("");

  const canSendMessage =
    draftMessage.trim().length > 0 ||
    draftLinks.length > 0 ||
    draftDocs.length > 0 ||
    uploadedAssets.length > 0;

  useEffect(() => {
    if (!onTypingStateChange) return;
    const nextState = draftMessage.trim().length > 0 ? "active" : "idle";
    if (lastTypingStateRef.current !== nextState) {
      lastTypingStateRef.current = nextState;
      onTypingStateChange(nextState);
    }

    if (nextState === "idle") return;

    const timeoutId = window.setTimeout(() => {
      if (lastTypingStateRef.current !== "idle") {
        lastTypingStateRef.current = "idle";
        onTypingStateChange("idle");
      }
    }, 1500);

    return () => window.clearTimeout(timeoutId);
  }, [draftMessage, onTypingStateChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSendMessage) {
        formRef.current?.requestSubmit();
      }
    }
  };

  function addDraftLink() {
    const url = pendingLinkUrl.trim();
    if (!url) return;

    setDraftLinks((current) => [
      ...current,
      {
        url,
        title: pendingLinkTitle.trim() || url,
        description: "Shared intentionally from the composer.",
        accent: "bg-slate-900 text-white",
      },
    ]);
    setPendingLinkUrl("");
    setPendingLinkTitle("");
    setAttachmentOpen(false);
  }

  function addDraftDoc() {
    const name = pendingDocName.trim();
    if (!name) return;

    const extension = name.split(".").pop()?.toUpperCase() ?? "FILE";

    setDraftDocs((current) => [
      ...current,
      {
        name,
        meta:
          pendingDocMeta.trim() ||
          `Shared intentionally • ${extension.toLowerCase()}`,
        tone: getDocTone(extension),
        short: extension,
      },
    ]);
    setPendingDocName("");
    setPendingDocMeta("");
    setAttachmentOpen(false);
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("sessionId", sessionId);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setUploadedAssets(prev => [...prev, data]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <form
      ref={formRef}
      className="relative flex flex-col gap-3"
      action={async (formData) => {
        try {
          if (isAiSession) {
            onAwaitingAiReplyChange?.(true);
          }

          await sendMessageAction(formData);
          setDraftMessage("");
          setDraftLinks([]);
          setDraftDocs([]);
          setUploadedAssets([]);
          setIsRecording(false);
          setAttachmentOpen(false);
          setPendingLinkUrl("");
          setPendingLinkTitle("");
          setPendingDocName("");
          setPendingDocMeta("");
          if (lastTypingStateRef.current !== "idle") {
            lastTypingStateRef.current = "idle";
            onTypingStateChange?.("idle");
          }
        } catch (error) {
          if (isAiSession) {
            onAwaitingAiReplyChange?.(false);
          }
          throw error;
        }
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sharedLinksJson" value={JSON.stringify(draftLinks)} />
      <input type="hidden" name="sharedDocsJson" value={JSON.stringify(draftDocs)} />
      <input type="hidden" name="sharedMediaJson" value="[]" />
      <input type="hidden" name="uploadedAssetsJson" value={JSON.stringify(uploadedAssets)} />
      <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

      <SmartReplies
        sessionId={sessionId}
        onSelect={(suggestion) => {
          setDraftMessage(suggestion);
          textareaRef.current?.focus();
        }}
      />

      {(draftLinks.length > 0 ||
        draftDocs.length > 0 ||
        uploadedAssets.length > 0) && (
          <div className="flex flex-wrap gap-2 px-1">
            {draftLinks.map((link, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full bg-[#f3f0e6] px-3 py-1 text-[11px] font-medium text-slate-700">
                <Link2 className="size-3 text-slate-400" />
                <span className="max-w-[120px] truncate">{link.title || link.url}</span>
                <button type="button" onClick={() => setDraftLinks(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="size-3 hover:text-slate-900" />
                </button>
              </div>
            ))}
            {draftDocs.map((doc, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full bg-[#f3f0e6] px-3 py-1 text-[11px] font-medium text-slate-700">
                <FileText className="size-3 text-slate-400" />
                <span className="max-w-[120px] truncate">{doc.name}</span>
                <button type="button" onClick={() => setDraftDocs(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="size-3 hover:text-slate-900" />
                </button>
              </div>
            ))}
            {uploadedAssets.map((asset, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full bg-[#2ea48c]/10 px-3 py-1 text-[11px] font-medium text-[#2ea48c]">
                <Paperclip className="size-3" />
                <span className="max-w-[120px] truncate">{asset.fileUrl?.split('/').pop() || 'File'}</span>
                <button type="button" onClick={() => setUploadedAssets(prev => prev.filter((_, idx) => idx !== i))}>
                  <X className="size-3 hover:text-[#1d6b5b]" />
                </button>
              </div>
            ))}
          </div>
        )}

      <div className="rounded-[26px] border border-[#efeadf] bg-[#fbf9f3] px-3 py-2 shadow-sm">
        <div className="flex items-end gap-3">
          <div className="min-w-0 flex-1">
            <Textarea
              ref={textareaRef}
              name="content"
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type any message..."
              className="min-h-[48px] max-h-32 w-full resize-none border-0 bg-transparent px-1 py-1 text-[13px] leading-relaxed shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1 pb-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-slate-400 hover:bg-[#efeadf] hover:text-slate-700"
                >
                  <Smile className="size-4.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                className="w-auto rounded-2xl border-[#efeadf] p-2 shadow-xl"
              >
                <div className="flex items-center gap-1">
                  {["🙂", "😂", "😍", "🔥", "👏", "👍"].map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-lg hover:bg-[#f3f0e6]"
                      onClick={() => {
                        setDraftMessage((current) =>
                          `${current}${current ? " " : ""}${emoji}`
                        );
                        textareaRef.current?.focus();
                      }}
                    >
                      <span aria-hidden>{emoji}</span>
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full text-slate-400 hover:bg-[#efeadf] hover:text-slate-700",
                isRecording && "bg-[#ffe7e7] text-[#d9485f] hover:bg-[#ffd6dc] hover:text-[#c93751]"
              )}
              onClick={() => setIsRecording((current) => !current)}
            >
              <Mic className={cn("size-4.5", isRecording && "animate-pulse")} />
            </Button>

          <Popover open={attachmentOpen} onOpenChange={setAttachmentOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full text-slate-400 hover:bg-[#efeadf] hover:text-slate-700",
                  isUploading && "animate-pulse"
                )}
                disabled={isUploading}
              >
                <Paperclip className="size-4.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-[320px] rounded-[24px] border-[#efeadf] p-4 shadow-xl">
              <div className="space-y-4">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#efeadf] bg-white px-3 py-3 text-left transition-colors hover:bg-[#f8f5ed]"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setAttachmentOpen(false);
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eef7f4] text-[#2ea48c]">
                    <ImageUp className="size-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Upload image or file
                    </p>
                    <p className="text-xs text-slate-500">
                      Share screenshots, photos, PDFs, or docs.
                    </p>
                  </div>
                </button>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Link
                  </p>
                  <Input
                    placeholder="https://example.com"
                    value={pendingLinkUrl}
                    onChange={(event) => setPendingLinkUrl(event.target.value)}
                    className="h-9 rounded-xl border-[#efeadf] text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Title"
                      value={pendingLinkTitle}
                      onChange={(event) => setPendingLinkTitle(event.target.value)}
                      className="h-9 rounded-xl border-[#efeadf] text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!pendingLinkUrl.trim()}
                      className="h-9 rounded-xl border-[#efeadf] text-xs"
                      onClick={addDraftLink}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Document
                  </p>
                  <Input
                    placeholder="Quarterly-plan.pdf"
                    value={pendingDocName}
                    onChange={(event) => setPendingDocName(event.target.value)}
                    className="h-9 rounded-xl border-[#efeadf] text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Optional meta"
                      value={pendingDocMeta}
                      onChange={(event) => setPendingDocMeta(event.target.value)}
                      className="h-9 rounded-xl border-[#efeadf] text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!pendingDocName.trim()}
                      className="h-9 rounded-xl border-[#efeadf] text-xs"
                      onClick={addDraftDoc}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

            <Button
              type="submit"
              disabled={!canSendMessage || isUploading}
              className={cn(
                "h-9 w-9 rounded-full shadow-none transition-all active:scale-95",
                canSendMessage
                  ? "bg-[#2ea48c] text-white hover:bg-[#24937d]"
                  : "bg-slate-200 text-slate-400"
              )}
            >
              <SendHorizonal className="size-4.5" />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
