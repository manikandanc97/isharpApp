"use client";

import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { PasswordInput } from "@/components/ui/password-input";
import { getAuthenticatedSession } from "@/lib/auth-session";
import { getPostAuthDestination, oauthStatusMessages } from "@/lib/oauth-flow";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";
import { LoginFooter } from "./login-footer";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

export function LoginForm({ initialAuthError = "" }: { initialAuthError?: string }) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState(initialAuthError);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  function validateForm() {
    const nextErrors: FieldErrors = {};
    if (!isValidEmail(identifier.trim())) {
      nextErrors.identifier = "Enter a valid email address.";
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

    setIsSubmitting(true);

    const cleanedIdentifier = identifier.trim().toLowerCase();

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanedIdentifier,
        password,
      });

      if (error) {
        setAuthError("Invalid email or password.");
        return;
      }

      if (!data.session) {
        setAuthError("Sign-in succeeded, but no session was created. Please try again.");
        return;
      }

      const activeSession = await getAuthenticatedSession(data.session.access_token);
      const destination = getPostAuthDestination(activeSession);
      router.replace(destination);
      router.refresh();
    } catch {
      setAuthError("Unable to reach the login service. Check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setAuthError("");
    setStatusMessage("");

    if (!isValidEmail(identifier.trim())) {
      setErrors((current) => ({
        ...current,
        identifier: "Enter a valid email address to reset your password.",
      }));
      return;
    }

    setIsResetting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        identifier.trim(),
      );

      if (error) {
        setAuthError("The reset link could not be sent. Please try again.");
        return;
      }

      setStatusMessage("Check your email for password reset link.");
    } catch {
      setAuthError("The reset link could not be sent. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  const inputBaseStyle =
    "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section
      aria-labelledby="login-heading"
      className="w-full min-w-0 max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-card"
    >
      {/* Top Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-brand-red uppercase">
          <ShieldCheck className="size-3.5 text-brand-red" />
          <span>Student LMS Portal</span>
        </div>
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
      </div>

      <h2
        id="login-heading"
        className="mt-2 type-page-title text-slate-900"
      >
        Welcome back
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Sign in to access your DPPs, test telemetry &amp; lecture notes.
      </p>

      {/* Main Login Form */}
      <form className="mt-3.5 space-y-2.5 sm:space-y-3" onSubmit={handleSubmit} noValidate>
        {/* Identifier Field */}
        <div className="space-y-1">
          <label
            htmlFor="identifier"
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id="identifier"
              name="identifier"
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={identifier}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? "identifier-error" : undefined}
              className={cn(inputBaseStyle, "pl-9")}
              onChange={(event) => {
                setIdentifier(event.target.value);
                setErrors((current) => ({ ...current, identifier: undefined }));
                setAuthError("");
                setStatusMessage("");
              }}
              onBlur={() => {
                const error = isValidEmail(identifier.trim())
                  ? undefined
                  : "Enter a valid email address.";
                setErrors((current) => ({ ...current, identifier: error }));
              }}
            />
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
          {errors.identifier && (
            <p
              id="identifier-error"
              role="alert"
              className="flex items-center gap-1 text-xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{errors.identifier}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your LMS password"
            value={password}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
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
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="flex items-center gap-1 text-xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Session and password recovery */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs font-medium text-slate-500">Secure cookie session</span>
          <button
            type="button"
            disabled={isSubmitting || isResetting}
            className="text-xs sm:text-sm font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
            onClick={handleForgotPassword}
          >
            {isResetting ? "Sending link…" : "Forgot password?"}
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div
            role="alert"
            className="flex gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-xs leading-snug text-rose-700"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
            <p>{authError}</p>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            role="status"
            className="flex gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-2 text-xs leading-snug text-emerald-800"
          >
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
            <p>{statusMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          size="default"
          disabled={isSubmitting || isResetting}
          className="mt-1 h-10.5 w-full cursor-pointer rounded-full bg-brand-red hover:bg-brand-red-hover text-xs sm:text-sm font-semibold text-white shadow-primary transition hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {isSubmitting && (
            <LoaderCircle
              aria-hidden="true"
              className="size-3.5 animate-spin motion-reduce:animate-none mr-2"
            />
          )}
          <span>{isSubmitting ? "Authenticating…" : "Sign In to LMS"}</span>
        </Button>
      </form>

      <div className="relative my-3 text-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-slate-200" /></div>
        <span className="relative bg-white px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">or</span>
      </div>
      <GoogleSignInButton onError={setAuthError} />

      <LoginFooter />
    </section>
  );
}

export function OAuthAwareLoginForm() {
  const searchParams = useSearchParams();
  const oauthState = searchParams.get("oauth");
  return <LoginForm initialAuthError={oauthState ? oauthStatusMessages[oauthState] ?? "" : ""} />;
}
