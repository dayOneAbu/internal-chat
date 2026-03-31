alter table "public"."Message"
  add column if not exists "reactions" jsonb;
