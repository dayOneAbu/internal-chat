import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorDescription) {
    const errorUrl = new URL("/auth", requestUrl.origin);
    errorUrl.searchParams.set("error", errorDescription);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const errorUrl = new URL("/auth", requestUrl.origin);
      errorUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(errorUrl);
    }
  }

  return NextResponse.redirect(new URL("/chat", requestUrl.origin));
}
