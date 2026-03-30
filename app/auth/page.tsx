import { redirect } from "next/navigation";

import { signInAction, signUpAction } from "@/app/auth/actions";
import TravelConnectSignIn1 from "@/components/ui/travel-connect-signin-1";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (claims) {
    redirect("/chat");
  }

  return (
    <TravelConnectSignIn1
      error={params.error}
      message={params.message}
      signInAction={signInAction}
      signUpAction={signUpAction}
    />
  );
}
