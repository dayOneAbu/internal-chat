"use server";

import { redirect } from "next/navigation";

import { findOrCreateDirectSession } from "@/lib/chat";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function requireCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user.id;
}

export async function openDirectSessionAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const targetUserId = getString(formData, "targetUserId");

  if (!targetUserId || targetUserId === currentUserId) {
    redirect("/chat");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true },
  });

  if (!targetUser) {
    redirect("/chat");
  }

  const session = await findOrCreateDirectSession(currentUserId, targetUserId);
  redirect(`/chat?session=${session.id}`);
}

export async function sendMessageAction(formData: FormData) {
  const currentUserId = await requireCurrentUserId();
  const sessionId = getString(formData, "sessionId");
  const content = getString(formData, "content");

  if (!sessionId || !content) {
    redirect(sessionId ? `/chat?session=${sessionId}` : "/chat");
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      participants: {
        some: {
          userId: currentUserId,
        },
      },
    },
    select: { id: true },
  });

  if (!session) {
    redirect("/chat");
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        sessionId,
        senderId: currentUserId,
        content,
      },
    }),
    prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    }),
  ]);

  redirect(`/chat?session=${sessionId}`);
}
