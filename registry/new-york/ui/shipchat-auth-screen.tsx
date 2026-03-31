"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react"

type AuthMode = "signin" | "signup"

type AuthAction = (formData: FormData) => void | Promise<void>

interface ShipchatAuthScreenProps {
  error?: string
  message?: string
  signInAction?: AuthAction
  signUpAction?: AuthAction
  initialMode?: AuthMode
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "default" | "outline" | "ghost"
}

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const Button = ({
  children,
  variant = "default",
  className,
  ...props
}: ButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variantStyles = {
    default:
      "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-200/70 hover:-translate-y-px hover:shadow-xl hover:shadow-blue-200/80",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900",
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = ({ className, ...props }: InputProps) => {
  return (
    <input
      className={cn(
        "flex h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm shadow-slate-100/80 ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

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
]

function InternalNetworkPreview() {
  return (
    <div className="relative h-[720px] overflow-hidden rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,#eef4ff_0%,#e7eefc_48%,#e2e8f8_100%)] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
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
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/75 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-700">
            Internal Communication
          </span>
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
        </div>

        <div className="absolute inset-x-0 bottom-0 grid gap-3">
          {featureCards.map(({ icon: Icon, title, copy }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + index * 0.1, duration: 0.4 }}
              className="rounded-[1.5rem] border border-white/70 bg-white/82 px-5 py-4 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-blue-600" />
                <span className="text-[15px] font-medium text-slate-900">
                  {title}
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-600">{copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AuthTabs({
  mode,
  setMode,
}: {
  mode: AuthMode
  setMode: (mode: AuthMode) => void
}) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setMode("signin")}
        className={cn(
          "rounded-full px-4 py-2 text-sm transition-all",
          mode === "signin"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500"
        )}
      >
        Sign in
      </button>
      <button
        type="button"
        onClick={() => setMode("signup")}
        className={cn(
          "rounded-full px-4 py-2 text-sm transition-all",
          mode === "signup"
            ? "bg-white text-slate-900 shadow-sm"
            : "text-slate-500"
        )}
      >
        Create account
      </button>
    </div>
  )
}

const noopAction: AuthAction = async () => {}

export function ShipchatAuthScreen({
  error,
  message,
  signInAction = noopAction,
  signUpAction = noopAction,
  initialMode = "signin",
}: ShipchatAuthScreenProps) {
  const [mode, setMode] = React.useState<AuthMode>(initialMode)
  const [signInPasswordVisible, setSignInPasswordVisible] = React.useState(false)
  const [signUpPasswordVisible, setSignUpPasswordVisible] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.08),_transparent_24%),linear-gradient(180deg,_#f8fbff,_#eef3ff)] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-7xl">
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
          className="grid overflow-hidden rounded-[2.25rem] border border-white/70 bg-white/80 shadow-[0_35px_120px_rgba(99,102,241,0.12)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="hidden p-5 xl:block">
            <InternalNetworkPreview />
          </div>

          <div className="flex min-h-[720px] items-center bg-white px-6 py-8 md:px-10 xl:px-12">
            <div className="mx-auto w-full max-w-[29rem]">
              <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-blue-700">
                    Secure Access
                  </span>
                  <div>
                    <h1 className="text-[2.35rem] font-semibold tracking-tight text-slate-950">
                      Welcome back
                    </h1>
                    <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
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

              <div className="mb-6 rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-3 shadow-sm">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-[1.1rem] border-slate-200 bg-white text-slate-400"
                  disabled
                >
                  <LockKeyhole className="h-4 w-4" />
                  Google OAuth on hosted pass
                </Button>
              </div>

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
                          className="pr-12"
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
                          "relative h-14 w-full overflow-hidden rounded-[1.2rem] text-base",
                          isHovered &&
                            "shadow-[0_18px_40px_rgba(99,102,241,0.26)]"
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
                            className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent"
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
                          className="pr-12"
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

                    <Button
                      type="submit"
                      variant="outline"
                      className="h-14 w-full rounded-[1.2rem] border-slate-200 text-base text-slate-900"
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
    </div>
  )
}

export default ShipchatAuthScreen
