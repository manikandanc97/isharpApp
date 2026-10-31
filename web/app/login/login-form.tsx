"use client";

import { createClient } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LoaderCircle,
  Lock,
  Mail,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { getAuthenticatedSession } from "@/lib/auth-session";
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
    return "Enter your email or mobile number.";
  }

  if (
    !emailPattern.test(identifier) &&
    !phonePattern.test(normalizePhone(identifier))
  ) {
    return "Enter a valid email or mobile number.";
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
        "Sign-in service is currently in preview mode. Please contact I-Sharp Academy support.",
      );
      return;
    }

    setIsSubmitting(true);

    const cleanedIdentifier = identifier.trim();
    const credentials = emailPattern.test(cleanedIdentifier)
      ? { email: cleanedIdentifier, password }
      : { phone: normalizePhone(cleanedIdentifier), password };

    try {
      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (!error) {
        const accessToken = data.session?.access_token;
        if (!accessToken) {
          setAuthError("Your Supabase session did not include an access token.");
          return;
        }
        const session = await getAuthenticatedSession(accessToken);
        if (!session.roles.includes("STUDENT")) {
          await supabase.auth.signOut();
          setAuthError(
            "This account does not have active student access. Contact I-Sharp Academy support.",
          );
          return;
        }
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
        identifier: identifierError ?? "Enter your email to reset password.",
      }));
      return;
    }

    const supabase = getSupabaseClient(true);

    if (!supabase) {
      setAuthError(
        "Password reset is in preview mode. Please contact support.",
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

      setStatusMessage("Check your email for password reset link.");
    } catch {
      setAuthError("The reset link could not be sent. Please try again.");
    } finally {
      setIsResetting(false);
    }
  }

  const inputBaseStyle =
    "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2525b8] focus:ring-3 focus:ring-[#2525b8]/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section
      aria-labelledby="login-heading"
      className="w-full min-w-0 max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)]"
    >
      {/* Top Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-3xs font-bold tracking-wider text-[#2525b8] uppercase">
          <ShieldCheck className="size-3 text-[#2525b8]" />
          <span>Student LMS Portal</span>
        </div>
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
      </div>

      <h2
        id="login-heading"
        className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
      >
        Welcome back
      </h2>
      <p className="mt-0.5 text-2xs text-slate-500 sm:text-xs">
        Sign in to access your DPPs, test telemetry &amp; lecture notes.
      </p>

      {/* Main Login Form */}
      <form className="mt-3.5 space-y-2.5 sm:space-y-3" onSubmit={handleSubmit} noValidate>
        {/* Identifier Field */}
        <div className="space-y-1">
          <label
            htmlFor="identifier"
            className="block text-2xs sm:text-xs font-semibold text-slate-700"
          >
            Email or Mobile Number
          </label>
          <div className="relative">
            <input
              id="identifier"
              name="identifier"
              type="text"
              inputMode="email"
              autoComplete="username"
              placeholder="you@example.com or mobile"
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
                const error = validateIdentifier(identifier);
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
              className="flex items-center gap-1 text-2xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
              <span>{errors.identifier}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-2xs sm:text-xs font-semibold text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your LMS password"
              value={password}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={cn(inputBaseStyle, "pl-9 pr-10")}
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
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              disabled={isSubmitting}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 focus:outline-hidden disabled:cursor-not-allowed"
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" className="size-3.5" />
              ) : (
                <Eye aria-hidden="true" className="size-3.5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="flex items-center gap-1 text-2xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember Me and Forgot Password Row */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex cursor-pointer items-center gap-1.5 text-2xs sm:text-xs text-slate-600 select-none whitespace-nowrap hover:text-slate-900">
            <input
              type="checkbox"
              name="remember"
              checked={rememberMe}
              disabled={isSubmitting}
              className="size-3.5 rounded border-slate-300 text-[#2525b8] accent-[#2525b8] focus:ring-[#2525b8]"
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span className="font-medium">Remember me</span>
          </label>
          <button
            type="button"
            disabled={isSubmitting || isResetting}
            className="text-2xs sm:text-xs font-semibold text-[#2525b8] hover:underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
            onClick={handleForgotPassword}
          >
            {isResetting ? "Sending link…" : "Forgot password?"}
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div
            role="alert"
            className="flex gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-2xs leading-snug text-rose-700"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
            <p>{authError}</p>
          </div>
        )}

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            role="status"
            className="flex gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-2 text-2xs leading-snug text-emerald-800"
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
          className="mt-1 h-10.5 w-full cursor-pointer rounded-full bg-[#191747] hover:bg-[#2525b8] text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:shadow-md active:scale-[0.99] disabled:opacity-60"
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

      {/* Divider */}
      <div className="relative my-2.5 sm:my-3 text-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-2.5 text-3xs font-bold uppercase tracking-wider text-slate-400">
          New Student?
        </span>
      </div>

      {/* Register Promotion Box */}
      <Link
        href="/register"
        className="group flex items-center justify-between rounded-xl border border-rose-200/80 bg-rose-50/50 px-3 py-2 transition hover:bg-rose-50 hover:border-rose-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-[#e51d35] text-white shadow-2xs">
            <UserPlus className="size-3.5" />
          </div>
          <div>
            <p className="text-2xs sm:text-xs font-bold text-slate-900 group-hover:text-[#e51d35] transition">
              Apply for 2026 Batch Admission
            </p>
            <p className="text-3xs text-slate-500">
              NEET Bilingual &amp; Tamil Medium Cohort
            </p>
          </div>
        </div>
        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#e51d35]" />
      </Link>

      {/* Help & Support Footer */}
      <div className="mt-2.5 flex items-center justify-center gap-1 text-3xs text-slate-400">
        <Headphones className="size-2.5 text-slate-400" />
        <span>Helpline:</span>
        <a
          href="tel:+919894850370"
          className="font-semibold text-slate-600 hover:text-slate-900 hover:underline"
        >
          +91 98948 50370
        </a>
      </div>
    </section>
  );
}
