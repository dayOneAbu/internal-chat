alter table "public"."SessionParticipant"
  add column "isArchived" boolean not null default false,
  add column "isMuted" boolean not null default false,
  add column "lastReadAt" timestamptz,
  add column "clearedAt" timestamptz;
