import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

declare global {
  var __shipchatSupabaseAdmin__: ReturnType<typeof createClient> | undefined;
}

export function createSupabaseAdminClient() {
  if (!serverEnv.SUPABASE_SECRET_KEY) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  if (!globalThis.__shipchatSupabaseAdmin__) {
    globalThis.__shipchatSupabaseAdmin__ = createClient(
      publicEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return globalThis.__shipchatSupabaseAdmin__;
}
