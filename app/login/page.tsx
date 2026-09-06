"use client";

import * as React from "react";
import { signInAction, signUpAction, AuthActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Lock, Mail, Shield } from "lucide-react";

export default function LoginPage() {
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const action = mode === "signin" ? signInAction : signUpAction;

    try {
      const result: AuthActionResult = await action(null, formData);
      if (!result.success) {
        setErrorMessage(result.error || "Authentication failed. Please try again.");
      } else if (result.error) {
        // Success note (e.g., account created message)
        setSuccessMessage(result.error);
      }
    } catch (err: unknown) {
      // If Next.js redirect threw (which is normal in server actions), do not show error
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="h-10 w-10 rounded-[6px] bg-brand-primary/20 border border-brand-primary flex items-center justify-center text-brand-secondary font-mono text-base font-black mb-3 shadow-[0_0_15px_rgba(196,108,119,0.15)]">
          T
        </div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary font-mono">
            TRACE
          </h1>
          <Badge variant="brand" size="sm">
            v0.1
          </Badge>
        </div>
        <p className="text-xs text-text-secondary tracking-tight">
          &ldquo;Know what changed. Know what matters.&rdquo;
        </p>
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-sm p-6 sm:p-8 bg-background-elevated border-border shadow-lg">
        {/* Tab Toggle */}
        <div className="flex rounded-[4px] bg-surface p-1 mb-6 border border-border">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[3px] transition-colors ${
              mode === "signin"
                ? "bg-brand-surface text-brand-secondary border border-brand-primary/40 font-semibold"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-[3px] transition-colors ${
              mode === "signup"
                ? "bg-brand-surface text-brand-secondary border border-brand-primary/40 font-semibold"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-[4px] bg-negative/10 border border-negative/30 flex items-start gap-2.5 text-xs text-negative"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-[4px] bg-positive/10 border border-positive/30 flex items-start gap-2.5 text-xs text-positive"
          >
            <Shield className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider font-mono"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="investor@example.com"
                className="pl-8 bg-surface border-border text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-[11px] font-medium text-text-secondary uppercase tracking-wider font-mono"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-muted">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={6}
                placeholder="••••••••"
                className="pl-8 bg-surface border-border text-xs"
              />
            </div>
            {mode === "signup" && (
              <p className="text-[10px] text-text-muted">Minimum 6 characters</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 text-xs font-semibold h-9"
          >
            {isPending ? (
              <span>Processing...</span>
            ) : mode === "signin" ? (
              <>
                <span>Sign In to TRACE</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border-subtle text-center">
          <p className="text-[11px] text-text-muted">
            Indian Equities &middot; NIFTY 50 Benchmark &middot; Deterministic Memory
          </p>
        </div>
      </Card>
    </div>
  );
}
