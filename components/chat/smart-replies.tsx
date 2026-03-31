"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SmartRepliesResponse = {
  suggestions?: string[];
  basedOnMessageId?: string | null;
};

export function SmartReplies({
  sessionId,
  onSelect,
}: {
  sessionId: string;
  onSelect: (suggestion: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSuggestions([]);
    setIsOpen(false);
    setIsLoading(false);
  }, [sessionId]);

  async function loadSmartReplies() {
    const controller = new AbortController();

    setIsLoading(true);
    setIsOpen(true);

    try {
      const response = await fetch("/api/ai/smart-replies", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to load smart replies: ${response.status}`);
      }

      const payload = (await response.json()) as SmartRepliesResponse;

      setSuggestions(
        (payload.suggestions ?? []).filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0
        )
      );
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      console.error(error);
      setSuggestions([]);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }

  const hasSuggestions = suggestions.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        className="h-8 rounded-full bg-[#e9faf4] px-2.5 text-[11px] font-semibold text-[#24937d] hover:bg-[#daf5ec] hover:text-[#1f816e]"
        onClick={() => void loadSmartReplies()}
      >
        {isLoading ? (
          <LoaderCircle className="mr-1 size-3 animate-spin" />
        ) : (
          <Sparkles className="mr-1 size-3" />
        )}
        Smart replies
      </Button>

      {isOpen && isLoading && !hasSuggestions
        ? Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`smart-reply-skeleton-${index}`}
              className="h-8 w-28 animate-pulse rounded-full bg-[#f1eee6]"
            />
          ))
        : isOpen &&
          suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              className={cn(
                "h-8 rounded-full border-[#e8e2d6] bg-white px-3 text-xs font-medium text-slate-600 shadow-none hover:bg-[#f8f5ed] hover:text-slate-900"
              )}
              onClick={() => {
                onSelect(suggestion);
                setIsOpen(false);
              }}
            >
              {suggestion}
            </Button>
            ))}

      {isOpen ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-400 hover:bg-[#f1eee6] hover:text-slate-700"
          onClick={() => {
            setIsOpen(false);
            setSuggestions([]);
          }}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
