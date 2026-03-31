import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastCallEnded } from "@/lib/supabase/realtime";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const callId = body.callId;

  if (!callId) {
    return NextResponse.json({ error: "Missing callId" }, { status: 400 });
  }

  const call = await prisma.call.findUnique({ where: { id: callId } });
  if (!call || call.status === "ended") {
    return NextResponse.json({ success: true });
  }

  await prisma.call.update({
    where: { id: callId },
    data: { status: "ended", endedAt: new Date() }
  });

  await broadcastCallEnded(call.sessionId, { callId });

  return NextResponse.json({ success: true });
}
