"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { AuthLoginForm } from "@/components/shared/auth/auth-login-form";
import { getLoginErrorMessage } from "@/lib/auth-error";
import { completeLoginSession } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validation";
import { LoginFooter } from "./login-footer";

type FieldErrors = {
  identifier?: string;
  password?: string;
};

export function LoginForm({
  initialAuthError = "",
  initialExpiredNotice = "",
}: {
  initialAuthError?: string;
  initialExpiredNotice?: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState(initialAuthError);
  const [expiredNotice, setExpiredNotice] = useState(initialExpiredNotice);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!initialExpiredNotice && !initialAuthError) return;
    fetch("/api/auth/session-notice", { method: "DELETE" }).catch(() => {});
  }, [initialExpiredNotice, initialAuthError]);

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
    setExpiredNotice("");
    setStatusMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    const cleanedIdentifier = identifier.trim().toLowerCase();

    try {
      const supabase = createClient();
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanedIdentifier,
        password,
      });

      if (error && password.trim() !== password) {
        const retry = await supabase.auth.signInWithPassword({
          email: cleanedIdentifier,
          password: password.trim(),
        });
        if (!retry.error && retry.data.session) {
          data = retry.data;
          error = null;
        }
      }

      if (error) {
        setAuthError(getLoginErrorMessage(error));
        return;
      }

      if (!data.session) {
        setAuthError("Sign-in succeeded, but no session was created. Please try again.");
        return;
      }

      const { destination } = await completeLoginSession(
        data.session.access_token,
      );
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
    setExpiredNotice("");
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

  return (
    <AuthLoginForm
      headingId="login-heading"
      heading="Welcome back"
      subtitle="Sign in to access your DPPs, test telemetry & lecture notes."
      topBadge={
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-brand-red uppercase">
          <ShieldCheck className="size-3.5 text-brand-red" />
          <span>Student LMS Portal</span>
        </div>
      }
      topRight={
        <span
          className="size-2 rounded-full bg-emerald-500 animate-pulse"
          title="System Operational"
        />
      }
      emailId="identifier"
      emailLabel="Email address"
      emailPlaceholder="you@example.com"
      email={identifier}
      onEmailChange={(value) => {
        setIdentifier(value);
        setErrors((current) => ({ ...current, identifier: undefined }));
        setAuthError("");
        setStatusMessage("");
      }}
      emailError={errors.identifier}
      onEmailBlurInvalid={(message) =>
        setErrors((current) => ({ ...current, identifier: message }))
      }
      passwordId="password"
      passwordLabel="Password"
      passwordPlaceholder="Enter your LMS password"
      password={password}
      onPasswordChange={(value) => {
        setPassword(value);
        setErrors((current) => ({ ...current, password: undefined }));
        setAuthError("");
      }}
      passwordError={errors.password}
      isSubmitting={isSubmitting || isResetting}
      onSubmit={handleSubmit}
      submitLabel="Sign In to LMS"
      submittingLabel="Authenticating…"
      sessionMetaRow={
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs font-medium text-slate-500">
            Secure cookie session
          </span>
          <button
            type="button"
            disabled={isSubmitting || isResetting}
            className="text-xs sm:text-sm font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
            onClick={handleForgotPassword}
          >
            {isResetting ? "Sending link…" : "Forgot password?"}
          </button>
        </div>
      }
      expiredTitle="Session Expired"
      expiredNotice={expiredNotice}
      expiredSubNotice="உங்கள் அமர்வு முடிவடைந்தது. தொடர மீண்டும் உள்நுழையவும்."
      authError={authError}
      statusMessage={statusMessage}
      footer={
        <>
          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              or
            </span>
          </div>
          <GoogleSignInButton onError={setAuthError} />
          <LoginFooter />
        </>
      }
    />
  );
}
