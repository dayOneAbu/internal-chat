alter table "public"."Message"
  add column "sharedLinks" jsonb,
  add column "sharedDocs" jsonb,
  add column "sharedMedia" jsonb;
