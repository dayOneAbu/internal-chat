"use client";

import React, { type FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type AuthAction = (formData: FormData) => void | Promise<void>;

type TravelConnectSignInProps = {
  error?: string;
  message?: string;
  signInAction: AuthAction;
  signUpAction: AuthAction;
};

type NetworkNode = {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
};

const networkNodes: NetworkNode[] = [
];

const featureCards = [
  {
    icon: Zap,
    title: "Move fast",
    copy: "Push decisions through one shared surface instead of chasing updates across tools.",
  },
  {
    icon: ShieldCheck,
    title: "Break nothing",
    copy: "Protected access, durable sessions, and a calmer handoff layer keep the system stable.",
  },
  {
    icon: MessageSquareText,
    title: "Stay aligned",
    copy: "Product, ops, and engineering stay in the same loop without losing context.",
  },
];

function InternalNetworkPreview() {
  return (
    <div className="relative h-full min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#e7eefc_48%,#e2e8f8_100%)] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_68%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      </div>

      <div className="relative h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative mx-auto mb-8 flex max-w-[22rem] flex-col items-center text-center"
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
            <ArrowRight className="h-8 w-8 text-white" />
          </div>
          <Badge
            variant="outline"
            className="mb-3 rounded-full border-blue-200 bg-white/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-700"
          >
            Internal Communication
          </Badge>
          <h2 className="text-[2.35rem] font-semibold tracking-tight text-slate-900">
            ShipChat Internal
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-7 text-slate-600">
            The internal layer for teams that need to connect, communicate, and
            move fast without breaking what already works.
          </p>
        </motion.div>

        <div className="absolute inset-x-12 top-[12.8rem] bottom-[14rem]">
          <div className="absolute left-1/2 top-1/2 h-[2px] w-[66%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200" />
          <div className="absolute left-1/2 top-1/2 h-[62%] w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-blue-200 via-indigo-300 to-blue-200" />
          <div className="absolute left-[23%] top-[30%] h-[2px] w-[28%] rotate-[28deg] rounded-full bg-gradient-to-r from-blue-200 to-transparent" />
          <div className="absolute right-[20%] top-[34%] h-[2px] w-[24%] -rotate-[28deg] rounded-full bg-gradient-to-l from-blue-200 to-transparent" />
          <div className="absolute left-[24%] bottom-[30%] h-[2px] w-[26%] -rotate-[24deg] rounded-full bg-gradient-to-r from-blue-200 to-transparent" />
          <div className="absolute right-[22%] bottom-[28%] h-[2px] w-[26%] rotate-[24deg] rounded-full bg-gradient-to-l from-blue-200 to-transparent" />

          <motion.div
            animate={{
              x: ["-32%", "32%", "-32%"],
              opacity: [0.25, 1, 0.25],
            }}
            transition={{
              duration: 5.2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 shadow-[0_0_0_10px_rgba(59,130,246,0.12)]"
          />

          <motion.div
            animate={{
              y: ["-30%", "30%", "-30%"],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 4.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.6,
            }}
            className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500 shadow-[0_0_0_10px_rgba(139,92,246,0.12)]"
          />



          {networkNodes.map(({ icon: Icon, label, subtitle, className }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 * index + 0.35, duration: 0.4 }}
              className={cn(
                "absolute w-[11.75rem] rounded-[1.35rem] border border-white/70 bg-white/88 p-4 shadow-[0_18px_50px_rgba(148,163,184,0.18)] backdrop-blur",
                className
              )}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-medium text-slate-900">{label}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                {subtitle}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-4 px-8">
          {featureCards.map(({ icon: Icon, title, copy }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + index * 0.1, duration: 0.4 }}
              className="w-full max-w-[30rem]"
            >
              <Card className="gap-0 rounded-[1.5rem] border-white/70 bg-white/88 py-0 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur">
                <CardContent className="px-5 py-4">
                  <div className="mb-2.5 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-[15px] font-medium text-slate-900">
                      {title}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{copy}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthTabs({
  mode,
  setMode,
}: {
  mode: "signin" | "signup";
  setMode: (mode: "signin" | "signup") => void;
}) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as "signin" | "signup")}
      className="w-auto"
    >
      <TabsList className="rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
        <TabsTrigger value="signin" className="rounded-full px-4 py-2">
          Sign in
        </TabsTrigger>
        <TabsTrigger value="signup" className="rounded-full px-4 py-2">
          Create account
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

export default function TravelConnectSignIn1({
  error,
  message,
  signInAction,
  signUpAction,
}: TravelConnectSignInProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
  const [isHovered, setIsHovered] = useState(false);

  function handleSignUpSubmit(event: FormEvent<HTMLFormElement>) {
    if (signUpPassword !== signUpPasswordConfirmation) {
      event.preventDefault();
      setSignUpValidationError("Passwords do not match.");
      return;
    }

    setSignUpValidationError(null);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_24%),linear-gradient(180deg,_#f8fbff,_#eef3ff)]">
        <div className="mb-4 flex items-center justify-center md:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <MessageSquareText className="h-4 w-4 text-blue-600" />
            ShipChat Internal
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="min-h-screen overflow-hidden bg-white/80 backdrop-blur xl:grid xl:grid-cols-[0.96fr_1.04fr]"
        >
          <div className="hidden min-h-screen xl:block">
            <InternalNetworkPreview />
          </div>

          <div className="flex min-h-screen items-center bg-white px-6 py-8 md:px-10 xl:px-16 2xl:px-20">
            <div className="mx-auto w-full max-w-[33rem]">
              <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-700"
                  >
                    Secure Access
                  </Badge>
                  <div>
                    <h1 className="text-[3rem] leading-[0.94] font-semibold tracking-tight text-slate-950 md:text-[3.35rem]">
                      Welcome back
                    </h1>
                    <p className="mt-3 max-w-md text-[15px] leading-8 text-slate-500">
                      Enter ShipChat and keep the team moving fast without
                      breaking the systems around it.
                    </p>
                  </div>
                </div>

                <div className="hidden sm:block">
                  <AuthTabs mode={mode} setMode={setMode} />
                </div>
              </div>

              <div className="mb-5 sm:hidden">
                <AuthTabs mode={mode} setMode={setMode} />
              </div>

              <Card className="mb-6 gap-0 rounded-[1.6rem] border-slate-200 bg-slate-50/90 py-3 shadow-sm">
                <CardContent className="px-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-[1.1rem] border-slate-200 bg-white text-slate-400 hover:bg-white"
                  disabled
                >
                  <LockKeyhole className="h-4 w-4" />
                  Google OAuth on hosted pass
                </Button>
                </CardContent>
              </Card>

              {error ? (
                <div className="mb-4 rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mb-4 rounded-[1.2rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

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
                    <div>
                      <label
                        htmlFor="signin-email"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Email <span className="text-blue-600">*</span>
                      </label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        required
                        placeholder="Enter your email address"
                        className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signin-password"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Password <span className="text-blue-600">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          name="password"
                          type={signInPasswordVisible ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Enter your password"
                          className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
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

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.992 }}
                      onHoverStart={() => setIsHovered(true)}
                      onHoverEnd={() => setIsHovered(false)}
                      className="pt-2"
                    >
                      <Button
                        type="submit"
                        className={cn(
                          "relative h-14 w-full overflow-hidden rounded-[1.2rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-base text-white shadow-lg shadow-blue-200/70 hover:translate-y-[-1px] hover:bg-transparent hover:opacity-100",
                          isHovered
                            ? "shadow-[0_18px_40px_rgba(99,102,241,0.26)]"
                            : ""
                        )}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          Sign in
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                        {isHovered ? (
                          <motion.span
                            initial={{ left: "-20%" }}
                            animate={{ left: "110%" }}
                            transition={{ duration: 1.05, ease: "easeInOut" }}
                            className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                            style={{ filter: "blur(10px)" }}
                          />
                        ) : null}
                      </Button>
                    </motion.div>

                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => setMode("signup")}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
                      >
                        <Sparkles className="h-4 w-4 text-blue-500" />
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
                        className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-email"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Email <span className="text-blue-600">*</span>
                      </label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        placeholder="Enter your email address"
                        className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="signup-password"
                        className="mb-2 block text-sm font-medium text-slate-700"
                      >
                        Password <span className="text-blue-600">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          name="password"
                          type={signUpPasswordVisible ? "text" : "password"}
                          required
                          minLength={6}
                          placeholder="Create a password"
                          className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
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
                        Re-enter password{" "}
                        <span className="text-blue-600">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="signup-password-confirmation"
                          type={
                            signUpPasswordConfirmationVisible
                              ? "text"
                              : "password"
                          }
                          required
                          minLength={6}
                          placeholder="Re-enter your password"
                          className="h-12 rounded-2xl border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm shadow-slate-100/80 placeholder:text-slate-400"
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
                            setSignUpPasswordConfirmationVisible(
                              (visible) => !visible
                            )
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
                      <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {signUpValidationError}
                      </div>
                    ) : null}

                    <Button
                      type="submit"
                      variant="outline"
                      className="h-14 w-full rounded-[1.2rem] border-slate-200 bg-white text-base text-slate-900 hover:bg-slate-50"
                    >
                      Create account
                    </Button>

                    <div className="pt-1 text-center">
                      <button
                        type="button"
                        onClick={() => setMode("signin")}
                        className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-blue-600"
                      >
                        <Sparkles className="h-4 w-4 text-blue-500" />
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
