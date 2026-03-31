"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = "/chat";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#fbf9f3] p-6 text-slate-900">
          <div className="relative w-full max-w-md overflow-hidden rounded-4xl border border-[#efeadf] bg-white p-8 shadow-xl">
            {/* Background design elements */}
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-[#dcf5ee]/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-[#f4f1ea]/50 blur-3xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff1f1] text-[#d9485f] shadow-sm">
                <AlertCircle className="size-8" />
              </div>

              <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
                Something went wrong
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                An unexpected error occurred in your workspace. We&apos;ve been notified and are looking into it.
              </p>

              {this.state.error?.message && (
                <div className="mt-6 w-full rounded-2xl bg-[#fdfbf6] p-4 text-left border border-[#f4f1ea]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Error Detail
                  </p>
                  <p className="mt-2 text-xs font-mono text-slate-600 line-clamp-3">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 rounded-2xl bg-[#2ea48c] py-6 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#24937d] active:scale-[0.98]"
                >
                  <RefreshCw className="mr-2 size-4" />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleReset}
                  className="flex-1 rounded-2xl border-[#efeadf] py-6 text-sm font-semibold text-slate-600 transition-all hover:bg-[#fbf9f3] active:scale-[0.98]"
                >
                  <Home className="mr-2 size-4" />
                  Go to Chat
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
