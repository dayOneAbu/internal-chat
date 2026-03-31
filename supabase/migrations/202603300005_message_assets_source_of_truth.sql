do $$
begin
  create type "public"."MessageAssetKind" as enum ('link', 'doc', 'media');
exception
  when duplicate_object then
    null;
end $$;

create table if not exists "public"."MessageAsset" (
  "id" text primary key,
  "messageId" text not null references "public"."Message"("id") on delete cascade,
  "kind" "public"."MessageAssetKind" not null,
  "createdAt" timestamptz not null default now(),
  "url" text,
  "title" text,
  "description" text,
  "accent" text,
  "name" text,
  "meta" text,
  "short" text,
  "tone" text,
  "month" text
);

create index if not exists "MessageAsset_messageId_kind_idx"
  on "public"."MessageAsset" ("messageId", "kind");

create index if not exists "MessageAsset_kind_createdAt_idx"
  on "public"."MessageAsset" ("kind", "createdAt");

insert into "public"."MessageAsset" (
  "id",
  "messageId",
  "kind",
  "createdAt",
  "url",
  "title",
  "description",
  "accent"
)
select
  md5(m."id" || ':link:' || coalesce(link_item->>'url', link_item::text)),
  m."id",
  'link'::"public"."MessageAssetKind",
  m."createdAt",
  link_item->>'url',
  link_item->>'title',
  link_item->>'description',
  link_item->>'accent'
from "public"."Message" m
cross join lateral jsonb_array_elements(coalesce(m."sharedLinks", '[]'::jsonb)) as link_item
on conflict ("id") do nothing;

insert into "public"."MessageAsset" (
  "id",
  "messageId",
  "kind",
  "createdAt",
  "name",
  "meta",
  "short",
  "tone"
)
select
  md5(m."id" || ':doc:' || coalesce(doc_item->>'name', doc_item::text)),
  m."id",
  'doc'::"public"."MessageAssetKind",
  m."createdAt",
  doc_item->>'name',
  doc_item->>'meta',
  doc_item->>'short',
  doc_item->>'tone'
from "public"."Message" m
cross join lateral jsonb_array_elements(coalesce(m."sharedDocs", '[]'::jsonb)) as doc_item
on conflict ("id") do nothing;

insert into "public"."MessageAsset" (
  "id",
  "messageId",
  "kind",
  "createdAt",
  "month",
  "tone"
)
select
  md5(
    m."id" || ':media:' ||
    coalesce(media_item->>'month', '') || ':' ||
    coalesce(media_item->>'tone', media_item::text)
  ),
  m."id",
  'media'::"public"."MessageAssetKind",
  m."createdAt",
  media_item->>'month',
  media_item->>'tone'
from "public"."Message" m
cross join lateral jsonb_array_elements(coalesce(m."sharedMedia", '[]'::jsonb)) as media_item
on conflict ("id") do nothing;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    alter publication supabase_realtime add table "public"."MessageAsset";
  end if;
exception
  when duplicate_object then
    null;
end $$;
