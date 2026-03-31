-- ==========================================
-- 1. DATABASE TABLES (public schema)
-- ==========================================

-- Enable RLS for the Message table
ALTER TABLE "public"."Message" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see messages in sessions they are part of
CREATE POLICY "Users can view session messages" ON "public"."Message"
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "public"."SessionParticipant"
    WHERE "public"."SessionParticipant"."sessionId" = "public"."Message"."sessionId"
    AND "public"."SessionParticipant"."userId" = auth.uid()::text
  )
);

-- ==========================================
-- 2. REALTIME AUTHORIZATION (realtime schema)
-- ==========================================
-- This is required for private: true in the code.

-- Enable RLS for the Realtime messages table
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to LISTEN to broadcast/presence
CREATE POLICY "Allow auth users to listen"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to SEND broadcast/presence
CREATE POLICY "Allow auth users to send"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
