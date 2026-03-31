"use client";

import React, { type FormEvent, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Zap,
} from "lucide-react";

import { ShipChatLogo } from "@/components/brand/shipchat-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";
type AuthAction = (formData: FormData) => void | Promise<void>;

type TravelConnectSignInProps = {
  error?: string;
  googleAuthEnabled: boolean;
  googleSignInAction: AuthAction;
  initialMode?: AuthMode;
  message?: string;
  signInAction: AuthAction;
  signUpAction: AuthAction;
};

const featureCards = [
  {
    icon: Zap,
    title: "Keep work moving",
    copy:
      "Messages, files, and quick decisions stay in one thread instead of scattering across tools.",
  },
  {
    icon: ShieldCheck,
    title: "Built for handoffs",
    copy:
      "Realtime presence, clean context, and durable history help teams move without losing signal.",
  },
  {
    icon: TimerReset,
    title: "Stay in sync",
    copy:
      "Operations, product, and engineering work from the same ShipChat surface with less lag and less drift.",
  },
];

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4.5">
      <path
        d="M21.64 12.204c0-.638-.057-1.25-.164-1.837H12v3.474h5.41a4.628 4.628 0 0 1-2.007 3.037v2.52h3.246c1.9-1.75 2.99-4.326 2.99-7.194Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.963-.895 6.617-2.429l-3.246-2.52c-.9.603-2.053.96-3.371.96-2.59 0-4.782-1.748-5.566-4.096H3.078v2.598A9.994 9.994 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.434 13.915A5.998 5.998 0 0 1 6.123 12c0-.665.115-1.31.311-1.915V7.487H3.078A9.995 9.995 0 0 0 2 12c0 1.612.385 3.137 1.078 4.513l3.356-2.598Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.989c1.47 0 2.79.506 3.83 1.5l2.873-2.873C16.958 2.992 14.695 2 12 2A9.994 9.994 0 0 0 3.078 7.487l3.356 2.598C7.218 7.737 9.41 5.989 12 5.989Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthTabs({
  mode,
  setMode,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
}) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as AuthMode)}
      className="w-auto"
    >
      <TabsList className="rounded-full border border-[#e7e1d6] bg-[#f5f1e8] p-1 shadow-sm">
        <TabsTrigger
          value="signin"
          className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1f7c68] data-[state=active]:shadow-sm"
        >
          Sign in
        </TabsTrigger>
        <TabsTrigger
          value="signup"
          className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1f7c68] data-[state=active]:shadow-sm"
        >
          Create account
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function GoogleSubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      disabled={!enabled || pending}
      className={cn(
        "h-12 w-full rounded-[1.15rem] border-[#e7e1d6] bg-white text-sm font-medium text-slate-700 shadow-none hover:bg-[#f8f5ed]",
        !enabled && "cursor-not-allowed bg-[#f8f5ef] text-slate-400 hover:bg-[#f8f5ef]"
      )}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <GoogleMark />
      )}
      {enabled ? "Continue with Google" : "Google sign-in unavailable"}
    </Button>
  );
}

function SubmitButton({
  idleLabel,
  pendingLabel,
  tone = "primary",
}: {
  idleLabel: string;
  pendingLabel: string;
  tone?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "h-14 w-full rounded-[1.2rem] text-base shadow-none transition-all active:scale-[0.99]",
        tone === "primary"
          ? "bg-[#2ea48c] text-white hover:bg-[#24937d]"
          : "border border-[#d7eee8] bg-[#eef8f4] text-[#1f7c68] hover:bg-[#e5f5f0]"
      )}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}

function StatusBanner({
  kind,
  text,
}: {
  kind: "error" | "message";
  text: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border px-4 py-3 text-sm",
        kind === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-[#d7eee8] bg-[#eef8f4] text-[#1f7c68]"
      )}
    >
      {text}
    </div>
  );
}

function AuthPreview() {
  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbf9f3_0%,#f4efe6_100%)] p-10">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(46,164,140,0.16),_transparent_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(46,164,140,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(46,164,140,0.05)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <div className="relative flex h-full flex-col justify-between">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42 }}
          className="max-w-[27rem]"
        >
          <ShipChatLogo
            markClassName="size-14"
            nameClassName="text-[2rem]"
            subtitle="Shared messaging for the team behind the work"
          />

          <Badge
            variant="outline"
            className="mt-8 rounded-full border-[#d7eee8] bg-[#eef8f4] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#24937d]"
          >
            One platform, one thread
          </Badge>

          <h2 className="mt-5 text-[3rem] font-semibold leading-[0.96] tracking-tight text-slate-950">
            Keep every handoff inside ShipChat.
          </h2>
          <p className="mt-4 max-w-[26rem] text-[15px] leading-8 text-slate-600">
            Real-time presence, durable context, and clear threads for operations,
            product, and engineering.
          </p>

          <div className="mt-10 grid gap-3">
            {featureCards.map(({ icon: Icon, title, copy }, index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 * index + 0.25, duration: 0.35 }}
              >
                <Card className="rounded-[1.55rem] border-[#ede6da] bg-white/88 py-0 shadow-[0_18px_50px_rgba(70,59,37,0.08)] backdrop-blur">
                  <CardContent className="px-5 py-4">
                    <div className="mb-2.5 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef8f4] text-[#2ea48c]">
                        <Icon className="size-4.5" />
                      </div>
                      <span className="text-[15px] font-semibold text-slate-900">
                        {title}
                      </span>
                    </div>
                    <p className="text-sm leading-7 text-slate-600">{copy}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function TravelConnectSignIn1({
  error,
  googleAuthEnabled,
  googleSignInAction,
  initialMode = "signin",
  message,
  signInAction,
  signUpAction,
}: TravelConnectSignInProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [signInPasswordVisible, setSignInPasswordVisible] = useState(false);
  const [signUpPasswordVisible, setSignUpPasswordVisible] = useState(false);
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpPasswordConfirmation, setSignUpPasswordConfirmation] =
    useState("");
  const [signUpPasswordConfirmationVisible, setSignUpPasswordConfirmationVisible] =
    useState(false);
  const [signUpValidationError, setSignUpValidationError] = useState<
    string | null
  >(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    setSignUpValidationError(null);
  }, [mode]);

  function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    if (signUpPassword !== signUpPasswordConfirmation) {
      event.preventDefault();
      setSignUpValidationError("Passwords do not match.");
      return;
    }

    setSignUpValidationError(null);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(46,164,140,0.09),_transparent_24%),linear-gradient(180deg,_#f9f6ef,_#f3ede3)]">
      <div className="mb-4 flex items-center justify-center px-4 pt-4 xl:hidden">
        <div className="rounded-full border border-[#d7eee8] bg-white/88 px-4 py-2 shadow-sm">
          <ShipChatLogo markClassName="size-9" nameClassName="text-base" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="min-h-screen overflow-hidden bg-white/75 backdrop-blur xl:grid xl:grid-cols-[1.02fr_0.98fr]"
      >
        <div className="hidden min-h-screen border-r border-[#ece4d8] xl:block">
          <AuthPreview />
        </div>

        <div className="flex min-h-screen items-center bg-white px-6 py-8 md:px-10 xl:px-16 2xl:px-20">
          <div className="mx-auto w-full max-w-[32rem]">
            <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-[#d7eee8] bg-[#eef8f4] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#24937d]"
                >
                  Secure access
                </Badge>

                <div className="space-y-3">
                  <div className="hidden xl:block">
                    <ShipChatLogo
                      markClassName="size-11"
                    />
                  </div>

                  <div>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block">
                <AuthTabs mode={mode} setMode={setMode} />
              </div>
            </div>

            <div className="mb-5 sm:hidden">
              <AuthTabs mode={mode} setMode={setMode} />
            </div>

            <Card className="mb-5 gap-0 rounded-[1.65rem] border-[#ece4d8] bg-[#fbf9f3] py-0 shadow-[0_18px_40px_rgba(70,59,37,0.06)]">
              <CardContent className="space-y-3 px-4 py-4">
                <form action={googleSignInAction}>
                  <input type="hidden" name="mode" value={mode} />
                  <GoogleSubmitButton enabled={googleAuthEnabled} />
                </form>
                <p className="text-xs leading-6 text-slate-500">
                  {googleAuthEnabled
                    ? "Use your Google account to continue into ShipChat without creating a separate password."
                    : "Google OAuth is currently unavailable in this environment. Email and password still work normally."}
                </p>
              </CardContent>
            </Card>

            <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
              <div className="h-px flex-1 bg-[#ece4d8]" />
              <span>Or continue with email</span>
              <div className="h-px flex-1 bg-[#ece4d8]" />
            </div>

            {error ? <StatusBanner kind="error" text={error} /> : null}
            {message ? <StatusBanner kind="message" text={message} /> : null}
            {error || message ? <div className="mb-4" /> : null}

            <AnimatePresence mode="wait" initial={false}>
              {mode === "signin" ? (
                <motion.form
                  key="signin"
                  action={signInAction}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <input type="hidden" name="mode" value="signin" />

                  <div>
                    <label
                      htmlFor="signin-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email <span className="text-[#2ea48c]">*</span>
                    </label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signin-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Password <span className="text-[#2ea48c]">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        name="password"
                        type={signInPasswordVisible ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Enter your password"
                        className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700"
                        onClick={() =>
                          setSignInPasswordVisible((visible) => !visible)
                        }
                      >
                        {signInPasswordVisible ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                  </div>

                  <SubmitButton
                    idleLabel="Sign in"
                    pendingLabel="Signing in..."
                  />

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#24937d]"
                    >
                      <Sparkles className="h-4 w-4 text-[#2ea48c]" />
                      Don&apos;t have an account? Create one.
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  action={signUpAction}
                  onSubmit={handleSignUpSubmit}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.22 }}
                  className="space-y-5"
                >
                  <input type="hidden" name="mode" value="signup" />

                  <div>
                    <label
                      htmlFor="signup-name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Full name
                    </label>
                    <Input
                      id="signup-name"
                      name="fullName"
                      type="text"
                      placeholder="Enter your name"
                      className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email <span className="text-[#2ea48c]">*</span>
                    </label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      placeholder="Enter your email address"
                      className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Password <span className="text-[#2ea48c]">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        name="password"
                        type={signUpPasswordVisible ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Create a password"
                        className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                        value={signUpPassword}
                        onChange={(event) => {
                          setSignUpPassword(event.target.value);
                          if (signUpValidationError) {
                            setSignUpValidationError(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700"
                        onClick={() =>
                          setSignUpPasswordVisible((visible) => !visible)
                        }
                      >
                        {signUpPasswordVisible ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="signup-password-confirmation"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Re-enter password <span className="text-[#2ea48c]">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        id="signup-password-confirmation"
                        type={
                          signUpPasswordConfirmationVisible ? "text" : "password"
                        }
                        required
                        minLength={6}
                        placeholder="Re-enter your password"
                        className="h-12 rounded-2xl border-[#e7e1d6] bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-[#2ea48c]/35"
                        value={signUpPasswordConfirmation}
                        onChange={(event) => {
                          setSignUpPasswordConfirmation(event.target.value);
                          if (signUpValidationError) {
                            setSignUpValidationError(null);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700"
                        onClick={() =>
                          setSignUpPasswordConfirmationVisible((visible) => !visible)
                        }
                      >
                        {signUpPasswordConfirmationVisible ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {signUpValidationError ? (
                    <StatusBanner kind="error" text={signUpValidationError} />
                  ) : (
                    <div>
                    </div>
                  )}

                  <SubmitButton
                    idleLabel="Create account"
                    pendingLabel="Creating account..."
                    tone="secondary"
                  />

                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-[#24937d]"
                    >
                      <LockKeyhole className="h-4 w-4 text-[#2ea48c]" />
                      Already have an account? Sign in.
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
