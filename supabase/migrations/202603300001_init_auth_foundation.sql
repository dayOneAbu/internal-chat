DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SessionKind') THEN
    CREATE TYPE "SessionKind" AS ENUM ('direct', 'ai');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "avatarUrl" TEXT,
  "isAi" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Session" (
  "id" TEXT NOT NULL,
  "kind" "SessionKind" NOT NULL DEFAULT 'direct',
  "directKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SessionParticipant" (
  "sessionId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SessionParticipant_pkey" PRIMARY KEY ("sessionId", "userId")
);

CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isAi" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_directKey_key" ON "Session"("directKey");
CREATE INDEX IF NOT EXISTS "SessionParticipant_userId_idx" ON "SessionParticipant"("userId");
CREATE INDEX IF NOT EXISTS "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SessionParticipant_sessionId_fkey'
  ) THEN
    ALTER TABLE "SessionParticipant"
      ADD CONSTRAINT "SessionParticipant_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'SessionParticipant_userId_fkey'
  ) THEN
    ALTER TABLE "SessionParticipant"
      ADD CONSTRAINT "SessionParticipant_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Message_sessionId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "Session"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Message_senderId_fkey'
  ) THEN
    ALTER TABLE "Message"
      ADD CONSTRAINT "Message_senderId_fkey"
      FOREIGN KEY ("senderId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
