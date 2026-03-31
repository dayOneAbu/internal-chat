import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot always write cookies directly.
          }
        },
      },
    }
  );
}

export function createSupabaseAdminClient() {
  const secretKey = serverEnv.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Missing Supabase admin credentials (SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
