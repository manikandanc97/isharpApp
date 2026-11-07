"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Headphones,
  LoaderCircle,
  Mail,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { isValidEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";
import {
  AdminControlCenterPreview,
  type AuthenticatedAdminUser,
} from "./admin-control-center-preview";

const inputBaseStyle =
  "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const [authenticatedUser, setAuthenticatedUser] =
    useState<AuthenticatedAdminUser | null>(null);

  function validate() {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = "Enter your official academy email.";
    } else if (!isValidEmail(trimmedEmail)) {
      errs.email = "Enter a valid email address.";
    }

    if (!password) {
      errs.password = "Enter your security password.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError("");

    if (!validate()) return;

    setIsSubmitting(true);
    const cleanedEmail = email.trim().toLowerCase();

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanedEmail, password }),
      });
      const result = (await response.json()) as {
        message?: string;
        destination?: string;
        role?: string;
        displayName?: string;
      };
      if (!response.ok || !result.destination) {
        setAuthError(result.message ?? "Sign-in could not be completed.");
        return;
      }

      router.replace(result.destination);
      router.refresh();
    } catch {
      setAuthError(
        "Unable to reach the application login service. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authenticatedUser) {
    return (
      <AdminControlCenterPreview
        user={authenticatedUser}
        onSignOutSuccess={() => setAuthenticatedUser(null)}
      />
    );
  }

  return (
    <section
      aria-labelledby="admin-login-heading"
      className="w-full min-w-0 max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-700 uppercase">
          <Shield className="size-3.5 text-slate-600" />
          <span>Restricted Portal</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Secure Login</span>
        </div>
      </div>

      <div className="mt-2.5">
        <h2
          id="admin-login-heading"
          className="type-section-title text-slate-900"
        >
          Administrator Sign In
        </h2>
        <p className="text-xs text-slate-500">
          Sign in to access curriculum management, question banks &amp; telemetry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3" noValidate>
        <div className="space-y-1">
          <label
            htmlFor="admin-email"
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            Administrator Email *
          </label>
          <div className="relative">
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@isharpacademy.in"
              value={email}
              disabled={isSubmitting}
              className={cn(inputBaseStyle, "pl-9")}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: undefined }));
                setAuthError("");
              }}
              onBlur={() => {
                if (!email.trim()) {
                  setErrors((prev) => ({
                    ...prev,
                    email: "Email is required.",
                  }));
                } else if (!isValidEmail(email)) {
                  setErrors((prev) => ({
                    ...prev,
                    email: "Enter a valid email address.",
                  }));
                }
              }}
            />
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="admin-pass"
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            Security Passcode *
          </label>
          <PasswordInput
            id="admin-pass"
            name="admin-pass"
            autoComplete="current-password"
            placeholder="Enter your security passcode"
            value={password}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.password)}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
              setAuthError("");
            }}
          />
          {errors.password && (
            <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-0.5 text-xs text-slate-600">
          <span>Secure cookie session</span>
          <span className="text-xs text-slate-400">256-Bit Encrypted</span>
        </div>

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-xs leading-snug text-rose-700"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
            <p>{authError}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-10.5 w-full cursor-pointer rounded-full bg-brand-red hover:bg-brand-red-hover text-xs sm:text-sm font-semibold text-white shadow-primary transition hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin mr-2" />
              <span>Verifying Credentials…</span>
            </>
          ) : (
            <span>Sign In to Administration</span>
          )}
        </Button>
      </form>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400">Enrolled Student?</span>
        <Link
          href="/login"
          className="font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline"
        >
          Go to Student LMS →
        </Link>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1 text-xs text-slate-400">
        <Headphones className="size-2.5 text-slate-400" />
        <span>IT Desk Helpline:</span>
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
