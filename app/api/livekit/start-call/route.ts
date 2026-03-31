import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastCallStarted } from "@/lib/supabase/realtime";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const sessionId = body.sessionId;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Ensure they are a participant
  const pt = await prisma.sessionParticipant.findUnique({
    where: { sessionId_userId: { sessionId, userId: user.id } },
  });
  if (!pt) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const roomName = `session:${sessionId}:${Date.now()}`;

  const call = await prisma.call.create({
    data: {
      sessionId,
      roomName,
    },
  });

  await broadcastCallStarted(sessionId, {
    callId: call.id,
    roomName: call.roomName,
    initiatorId: user.id,
  });

  return NextResponse.json({ callId: call.id, roomName: call.roomName });
}
