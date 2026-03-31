import { NextResponse } from "next/server";
import { z } from "zod";

import { generateSmartReplies, type ShipAssistMessage } from "@/lib/ai/ship-assist";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = requestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const participant = await prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId: parsed.data.sessionId,
          userId: user.id,
        },
      },
      select: {
        clearedAt: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: {
        sessionId: parsed.data.sessionId,
        ...(participant.clearedAt
          ? {
              createdAt: {
                gt: participant.clearedAt,
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      include: {
        sender: {
          select: {
            id: true,
            isAi: true,
          },
        },
      },
    });

    const orderedMessages = [...messages].reverse();
    const lastMessage = orderedMessages[orderedMessages.length - 1] ?? null;

    const transcript: ShipAssistMessage[] = orderedMessages.map((message) => ({
      role:
        message.senderId === user.id
          ? "user"
          : message.sender.isAi
            ? "assistant"
            : "peer",
      content: message.content,
    }));

    const suggestions = await generateSmartReplies(transcript);

    return NextResponse.json({
      suggestions,
      basedOnMessageId: lastMessage?.id ?? null,
    });
  } catch (error) {
    console.error("[SmartReplies] request failed", error);
    return NextResponse.json(
      { error: "Unable to generate smart replies right now." },
      { status: 500 }
    );
  }
}
