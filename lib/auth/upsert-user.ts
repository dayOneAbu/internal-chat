import type { User } from "@supabase/supabase-js";

import { prisma } from "@/lib/prisma";

function getDisplayName(user: User) {
  const fullName = user.user_metadata.full_name;
  const name = user.user_metadata.name;
  const emailName = user.email?.split("@")[0];

  return fullName ?? name ?? emailName ?? null;
}

function getAvatarUrl(user: User) {
  return user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null;
}

export async function upsertSupabaseUser(user: User) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {
      email: user.email ?? null,
      name: getDisplayName(user),
      avatarUrl: getAvatarUrl(user),
    },
    create: {
      id: user.id,
      email: user.email ?? null,
      name: getDisplayName(user),
      avatarUrl: getAvatarUrl(user),
    },
  });
}
