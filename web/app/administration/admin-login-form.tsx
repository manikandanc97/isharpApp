"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Headphones, Shield } from "lucide-react";

import { AuthLoginForm } from "@/components/shared/auth/auth-login-form";
import { ApiClientError } from "@/lib/api-client";
import { getLoginErrorMessage } from "@/lib/auth-error";
import { completeLoginSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";

export function AdminLoginForm({
  initialSessionNotice = "",
  initialAuthError = "",
}: {
  initialSessionNotice?: string;
  initialAuthError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState(initialAuthError);
  const [sessionExpiredNotice, setSessionExpiredNotice] =
    useState(initialSessionNotice);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (!initialSessionNotice && !initialAuthError) return;
    fetch("/api/auth/session-notice", { method: "DELETE" }).catch(() => {});
  }, [initialSessionNotice, initialAuthError]);

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
    setSessionExpiredNotice("");

    if (!validate()) return;

    setIsSubmitting(true);
    const cleanedEmail = email.trim().toLowerCase();

    try {
      const supabase = createClient();
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });

      if (error && password.trim() !== password) {
        const retryResult = await supabase.auth.signInWithPassword({
          email: cleanedEmail,
          password: password.trim(),
        });
        if (!retryResult.error && retryResult.data.session) {
          data = retryResult.data;
          error = null;
        }
      }

      if (error) {
        setAuthError(getLoginErrorMessage(error));
        return;
      }

      if (!data.session?.access_token || !data.user) {
        setAuthError("Sign-in succeeded, but no session was created. Please try again.");
        return;
      }

      let targetDestination = "/admin";
      try {
        const { session: activeSession, destination } =
          await completeLoginSession(data.session.access_token);
        const hasAdminAccess = hasRequiredRole(activeSession.roles, "ADMIN");

        if (!hasAdminAccess) {
          await supabase.auth.signOut();
          setAuthError("This account does not have administrator access.");
          return;
        }
        targetDestination = destination;
      } catch (sessionError) {
        await supabase.auth.signOut();
        if (sessionError instanceof ApiClientError) {
          if (sessionError.status === 403) {
            setAuthError("This account does not have administrator access.");
          } else if (sessionError.status === 401) {
            setAuthError("Your session could not be verified. Please sign in again.");
          } else if (sessionError.status === 429) {
            setAuthError("Too many sign-in attempts. Please wait a minute and try again.");
          } else if (
            sessionError.status === 0 ||
            sessionError.message.toLowerCase().includes("fetch") ||
            sessionError.message.toLowerCase().includes("network")
          ) {
            setAuthError("Cannot connect to the server. Please check your connection.");
          } else if (sessionError.status === 408) {
            setAuthError("The authorization request timed out. Please try again.");
          } else {
            setAuthError(
              "The authorization service is temporarily unavailable. Please try again.",
            );
          }
        } else {
          setAuthError(getLoginErrorMessage(sessionError));
        }
        return;
      }

      router.replace(targetDestination);
      router.refresh();
    } catch {
      setAuthError(
        "Cannot connect to the server. Please check your connection.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLoginForm
      headingId="admin-login-heading"
      heading="Administrator Sign In"
      subtitle="Sign in to access curriculum management, question banks & telemetry."
      topBadge={
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-slate-700 uppercase">
          <Shield className="size-3.5 text-slate-600" />
          <span>Restricted Portal</span>
        </div>
      }
      topRight={
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Secure Login</span>
        </div>
      }
      emailId="admin-email"
      emailLabel="Administrator Email *"
      emailPlaceholder="admin@isharpacademy.in"
      email={email}
      onEmailChange={(value) => {
        setEmail(value);
        setErrors((prev) => ({ ...prev, email: undefined }));
        setAuthError("");
      }}
      emailError={errors.email}
      onEmailBlurInvalid={(message) =>
        setErrors((prev) => ({ ...prev, email: message }))
      }
      passwordId="admin-pass"
      passwordLabel="Security Passcode *"
      passwordPlaceholder="Enter your security passcode"
      password={password}
      onPasswordChange={(value) => {
        setPassword(value);
        setErrors((prev) => ({ ...prev, password: undefined }));
        setAuthError("");
      }}
      passwordError={errors.password}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Sign In to Administration"
      submittingLabel="Verifying Credentials…"
      sessionMetaRow={
        <div className="flex items-center justify-between pt-0.5 text-xs text-slate-600">
          <span>Secure cookie session</span>
          <span className="text-xs text-slate-400">256-Bit Encrypted</span>
        </div>
      }
      expiredTitle="Administrative Session Expired"
      expiredNotice={sessionExpiredNotice}
      authError={authError}
      footer={
        <>
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
        </>
      }
    />
  );
}
