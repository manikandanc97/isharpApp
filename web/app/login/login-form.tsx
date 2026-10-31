"use client";

import { createClient } from "@supabase/supabase-js";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9]{8,15}$/;

function normalizePhone(value: string): string {
  return value.replace(/[\s()-]/g, "");
}

function validateIdentifier(value: string): string | undefined {
  const identifier = value.trim();

  if (!identifier) {
    return "Enter your email address or mobile number.";
  }

  if (
    !emailPattern.test(identifier) &&
    !phonePattern.test(normalizePhone(identifier))
  ) {
    return "Enter a valid email address or mobile number.";
  }
}

function getSupabaseClient(rememberMe: boolean) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: rememberMe ? window.localStorage : window.sessionStorage,
    },
  });
}

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  function validateForm() {
    const nextErrors: FieldErrors = {};
    const identifierError = validateIdentifier(identifier);

    if (identifierError) {
      nextErrors.identifier = identifierError;
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setStatusMessage("");

    if (!validateForm()) {
      return;
    }

    const supabase = getSupabaseClient(rememberMe);

    if (!supabase) {
      setAuthError(
        "Sign-in is not configured yet. Please contact I-Sharp Academy support.",
      );
      return;
    }

    setIsSubmitting(true);

    const cleanedIdentifier = identifier.trim();
    const credentials = emailPattern.test(cleanedIdentifier)
      ? { email: cleanedIdentifier, password }
      : { phone: normalizePhone(cleanedIdentifier), password };
    try {
      const { error } = await supabase.auth.signInWithPassword(credentials);

      if (!error) {
        router.replace("/");
        router.refresh();
        return;
      }

      setAuthError(
        error.message.toLowerCase().includes("invalid login credentials")
          ? "The email/mobile or password you entered is incorrect."
          : error.message,
      );
    } catch {
      setAuthError("Sign-in could not be completed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setAuthError("");
    setStatusMessage("");

    const identifierError = validateIdentifier(identifier);

    if (identifierError || !emailPattern.test(identifier.trim())) {
      setErrors((current) => ({
        ...current,
        identifier: identifierError ?? "Enter your email address to reset your password.",
      }));
      return;
    }

    const supabase = getSupabaseClient(true);

    if (!supabase) {
      setAuthError(
        "Password reset is not configured yet. Please contact I-Sharp Academy support.",
      );
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        identifier.trim(),
      );

      if (error) {
        setAuthError(error.message);
        return;
      }

      setStatusMessage("Check your email for a secure password reset link.");
    } catch {
      setAuthError("The reset link could not be sent. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  const inputClassName =
    "h-12 w-full rounded-xl border border-input bg-background/40 px-3.5 text-sm text-foreground shadow-xs transition-colors outline-none placeholder:text-muted-foreground/70 hover:border-muted-foreground/50 focus-visible:border-secondary focus-visible:ring-3 focus-visible:ring-secondary/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

  return (
    <section
      aria-labelledby="login-heading"
      className="w-full min-w-0 max-w-md rounded-2xl border bg-card px-5 py-8 shadow-elevated xs:px-6 xs:py-9 sm:px-10 sm:py-11"
    >
      <div className="mb-7 h-1 w-10 rounded-full bg-primary" />
      <p className="text-sm font-semibold tracking-widest text-secondary uppercase">
        Secure learning portal
      </p>
      <h2
        id="login-heading"
        className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
      >
        Welcome back
      </h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Sign in to continue your learning journey with I-Sharp Academy.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label
            htmlFor="identifier"
            className="text-sm font-medium text-foreground"
          >
            Email or mobile number
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={identifier}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={errors.identifier ? "identifier-error" : undefined}
            className={inputClassName}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setErrors((current) => ({ ...current, identifier: undefined }));
              setAuthError("");
              setStatusMessage("");
            }}
            onBlur={() => {
              const error = validateIdentifier(identifier);
              setErrors((current) => ({ ...current, identifier: error }));
            }}
          />
          {errors.identifier && (
            <p
              id="identifier-error"
              role="alert"
              className="flex items-start gap-1.5 text-sm font-medium text-destructive"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {errors.identifier}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={cn(inputClassName, "pr-12")}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
                setAuthError("");
              }}
              onBlur={() => {
                if (!password) {
                  setErrors((current) => ({
                    ...current,
                    password: "Enter your password.",
                  }));
                }
              }}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-secondary/30 disabled:cursor-not-allowed motion-reduce:transition-none"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-4.5" />
              ) : (
                <Eye aria-hidden="true" className="size-4.5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="flex items-start gap-1.5 text-sm font-medium text-destructive"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-1 xs:flex-row xs:items-center xs:justify-between xs:gap-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-muted-foreground select-none">
            <input
              type="checkbox"
              name="remember"
              checked={rememberMe}
              disabled={isSubmitting}
              className="size-4 rounded border-input accent-primary outline-none focus-visible:ring-3 focus-visible:ring-secondary/20 disabled:cursor-not-allowed"
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember me
          </label>
          <button
            type="button"
            disabled={isSubmitting || isResetting}
            className="min-h-11 rounded-md px-1 text-left text-sm font-medium text-secondary underline-offset-4 outline-none transition-colors hover:text-secondary/80 hover:underline focus-visible:ring-3 focus-visible:ring-secondary/30 xs:px-0 xs:text-right disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
            onClick={handleForgotPassword}
          >
            {isResetting ? "Sending link…" : "Forgot password?"}
          </button>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm leading-5 text-destructive"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{authError}</p>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="flex gap-2.5 rounded-xl border border-secondary/20 bg-accent px-3.5 py-3 text-sm leading-5 text-accent-foreground"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p>{statusMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || isResetting}
          className="mt-1 h-12 w-full rounded-xl text-sm font-semibold shadow-primary hover:bg-primary/90 hover:shadow-primary-hover focus-visible:border-primary focus-visible:ring-primary/30 motion-safe:hover:-translate-y-px active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none"
        >
          {isSubmitting && (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          )}
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </section>
  );
}
