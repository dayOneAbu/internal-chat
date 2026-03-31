"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const authModeSchema = z.enum(["signin", "signup"]);
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .trim()
  .min(6, "Password must be at least 6 characters.");
const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
const signUpSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
  email: emailSchema,
  password: passwordSchema,
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getMode(formData: FormData, fallback: "signin" | "signup") {
  const value = formData.get("mode");
  const parsed = authModeSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function getFirstValidationError(error: z.ZodError) {
  const issue = error.issues[0];
  return issue?.message ?? "Please check your details and try again.";
}

function redirectWithMessage(
  path: string,
  kind: "error" | "message",
  message: string,
  mode?: "signin" | "signup"
) {
  const params = new URLSearchParams({ [kind]: message });

  if (mode) {
    params.set("mode", mode);
  }

  redirect(`${path}?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const mode = getMode(formData, "signin");
  const parsed = signInSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return redirectWithMessage(
      "/auth",
      "error",
      getFirstValidationError(parsed.error),
      mode
    );
  }

  const credentials = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    return redirectWithMessage("/auth", "error", error.message, mode);
  }

  redirect("/chat");
}

export async function signUpAction(formData: FormData) {
  const mode = getMode(formData, "signup");
  const parsed = signUpSchema.safeParse({
    fullName: getString(formData, "fullName"),
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return redirectWithMessage(
      "/auth",
      "error",
      getFirstValidationError(parsed.error),
      mode
    );
  }

  const credentials = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        full_name: credentials.fullName,
      },
      emailRedirectTo: new URL("/auth/callback", publicEnv.NEXT_PUBLIC_APP_URL).toString(),
    },
  });

  if (error) {
    return redirectWithMessage("/auth", "error", error.message, mode);
  }

  if (data.session) {
    redirect("/chat");
  }

  redirectWithMessage(
    "/auth",
    "message",
    "Account created. Check your email to confirm the sign-in link.",
    mode
  );
}

export async function signInWithGoogleAction(formData: FormData) {
  const mode = getMode(formData, "signin");

  if (!serverEnv.GOOGLE_AUTH_ENABLED) {
    return redirectWithMessage(
      "/auth",
      "error",
      "Google sign-in is unavailable in this environment.",
      mode
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", publicEnv.NEXT_PUBLIC_APP_URL).toString(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    return redirectWithMessage(
      "/auth",
      "error",
      error?.message ?? "Unable to start Google sign-in right now.",
      mode
    );
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
