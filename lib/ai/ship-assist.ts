import "server-only";

import { serverEnv } from "@/lib/env/server";
import { prisma } from "@/lib/prisma";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const SMART_REPLY_MODEL = "gemini-2.5-flash";
const AI_REPLY_MODEL = "gemini-2.5-flash";

export const SHIP_ASSIST_USER_ID = "shipassist-ai";
export const SHIP_ASSIST_USER_EMAIL = "ai@shipchat.internal";

export type ShipAssistMessage = {
  role: "user" | "peer" | "assistant";
  content: string;
};

export async function ensureShipAssistUser() {
  return prisma.user.upsert({
    where: {
      id: SHIP_ASSIST_USER_ID,
    },
    update: {
      email: SHIP_ASSIST_USER_EMAIL,
      name: "ShipAssist AI",
      isAi: true,
    },
    create: {
      id: SHIP_ASSIST_USER_ID,
      email: SHIP_ASSIST_USER_EMAIL,
      name: "ShipAssist AI",
      isAi: true,
    },
  });
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildTranscript(messages: ShipAssistMessage[]) {
  return messages
    .map((message) => {
      const speaker =
        message.role === "assistant"
          ? "Assistant"
          : message.role === "user"
            ? "User"
            : "Peer";

      return `${speaker}: ${message.content}`;
    })
    .join("\n");
}

function normalizeSuggestion(value: string) {
  return compactWhitespace(value.replace(/^["'`]+|["'`]+$/g, ""));
}

function uniqueSuggestions(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const normalized = normalizeSuggestion(value);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    next.push(normalized);
  }

  return next;
}

function fallbackSmartReplies(lastMessage: string) {
  const normalized = lastMessage.toLowerCase();

  if (/\b(thanks|thank you|appreciate it)\b/.test(normalized)) {
    return ["You're welcome.", "Anytime.", "Happy to help."];
  }

  if (
    /\b(eta|arrival|arrive|delivery|shipment|carrier|customs|status|delay)\b/.test(
      normalized
    )
  ) {
    return [
      "Checking the latest status.",
      "I'll confirm the ETA.",
      "Let me verify that now.",
    ];
  }

  if (/\?/.test(lastMessage) || /\b(can you|could you|please|need)\b/.test(normalized)) {
    return ["On it.", "I'll handle it.", "Checking now."];
  }

  if (/\b(sent|shared|uploaded|done|finished|completed|received)\b/.test(normalized)) {
    return ["Received.", "Looks good.", "Thanks for the update."];
  }

  return ["Got it.", "On it.", "I'll check."];
}

function resolveSmartReplyContext(messages: ShipAssistMessage[]) {
  const latestPeerMessage = [...messages]
    .reverse()
    .find((message) => message.role === "peer");
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const latestMessage = messages[messages.length - 1] ?? null;

  return latestPeerMessage ?? latestAssistantMessage ?? latestMessage;
}

function fallbackAiReply(lastUserMessage: string) {
  const normalized = lastUserMessage.toLowerCase();

  if (
    /\b(eta|arrival|arrive|delivery|shipment|carrier|customs|status|delay)\b/.test(
      normalized
    )
  ) {
    return "I can help frame a shipment update. Share the latest carrier note, ETA, or blocker and I'll turn it into a clear team-ready reply.";
  }

  if (/\b(help|draft|reply|respond|write)\b/.test(normalized)) {
    return "I can draft a concise reply. Paste the context you want me to use and I'll turn it into a short operational update.";
  }

  return "I'm ready to help with status updates, ETAs, carrier notes, customs questions, or drafting a clear reply for the team.";
}

function parseSuggestions(rawText: string) {
  try {
    const parsed = JSON.parse(rawText);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return rawText
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, ""))
      .filter(Boolean);
  }
}

async function callAnthropic(input: {
  system: string;
  prompt: string;
  maxTokens: number;
  model: string;
}) {
  if (!serverEnv.ANTHROPIC_API_KEY) {
    return null;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": serverEnv.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens,
      system: input.system,
      messages: [
        {
          role: "user",
          content: input.prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return payload.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim() ?? "";
}

async function callGemini(input: {
  system: string;
  prompt: string;
  maxTokens: number;
  model: string;
}) {
  if (!serverEnv.GEMINI_API_KEY) {
    return null;
  }

  const response = await fetch(
    `${GEMINI_API_URL}/${input.model}:generateContent?key=${serverEnv.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: input.system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: input.prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: input.maxTokens,
          temperature: 0.4,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  return payload.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("\n")
    .trim() ?? "";
}

async function callLanguageModel(input: {
  system: string;
  prompt: string;
  maxTokens: number;
  model: string;
}) {
  if (serverEnv.GEMINI_API_KEY) {
    return callGemini(input);
  }

  if (serverEnv.ANTHROPIC_API_KEY) {
    return callAnthropic(input);
  }

  return null;
}

export async function generateSmartReplies(messages: ShipAssistMessage[]) {
  const lastMessage = resolveSmartReplyContext(messages);
  const contextText = lastMessage?.content ?? "";

  const fallback = fallbackSmartReplies(contextText);

  if (!serverEnv.GEMINI_API_KEY && !serverEnv.ANTHROPIC_API_KEY) {
    return fallback;
  }

  const prompt = [
    "Generate exactly 3 short, natural reply suggestions based on the recent conversation.",
    "Rules:",
    "- Each suggestion must be under 10 words.",
    "- Return only a JSON array of strings.",
    "- Keep the tone concise and professional for a logistics chat.",
    "",
    "Conversation:",
    buildTranscript(messages),
  ].join("\n");

  try {
    const text = await callLanguageModel({
      model: SMART_REPLY_MODEL,
      maxTokens: 120,
      system:
        "You write short suggested replies for team chat. Be practical, natural, and concise.",
      prompt,
    });

    const suggestions = uniqueSuggestions(parseSuggestions(text ?? ""));

    return [...suggestions, ...fallback].slice(0, 3);
  } catch (error) {
    console.error("[ShipAssist] Smart replies failed, using fallback.", error);
    return fallback;
  }
}

export async function generateAiReply(messages: ShipAssistMessage[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!lastUserMessage) {
    return "How can I help?";
  }

  if (!serverEnv.GEMINI_API_KEY && !serverEnv.ANTHROPIC_API_KEY) {
    return fallbackAiReply(lastUserMessage.content);
  }

  const prompt = [
    "Reply to the user's latest message using the conversation context below.",
    "Stay concise and operational.",
    "",
    "Conversation:",
    buildTranscript(messages),
  ].join("\n");

  try {
    const text = await callLanguageModel({
      model: AI_REPLY_MODEL,
      maxTokens: 220,
      system:
        "You are ShipAssist, an internal logistics assistant. Help with shipment status, ETAs, carrier coordination, customs questions, and drafting concise operational replies. Keep responses under 150 words unless the user asks foWorkspace pulser more detail.",
      prompt,
    });

    return compactWhitespace(text || fallbackAiReply(lastUserMessage.content));
  } catch (error) {
    console.error("[ShipAssist] AI reply failed, using fallback.", error);
    return fallbackAiReply(lastUserMessage.content);
  }
}
