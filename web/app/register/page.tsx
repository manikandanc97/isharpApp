"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { getSignupErrorMessage } from "@/lib/auth-error";
import { getAuthenticatedSession } from "@/lib/auth-session";
import {
  buildOAuthCallbackUrl,
  getPostAuthDestination,
} from "@/lib/oauth-flow";
import { createClient } from "@/lib/supabase/client";
import {
  validateRegistration,
  type RegistrationFieldErrors,
} from "@/lib/validation";
import { cn } from "@/lib/utils";
import { RegisterBenefitsSidebar } from "./register-benefits-sidebar";
import { RegistrationConfirmation } from "./register-confirmation";
import { PageContainer, Stack } from "@/components/layout/layout-primitives";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegistrationFieldErrors>({});
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function validate() {
    const nextErrors = validateRegistration({
      email,
      password,
      confirmPassword,
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    if (!validate()) return;

    const normalizedEmail = email.trim().toLowerCase();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: buildOAuthCallbackUrl(window.location.origin),
        },
      });

      if (error) {
        if (isMountedRef.current) setAuthError(getSignupErrorMessage(error));
        return;
      }

      if (
        Array.isArray(data.user?.identities) &&
        data.user.identities.length === 0
      ) {
        if (isMountedRef.current) setAuthError("existing-account");
        return;
      }

      if (data.session?.access_token) {
        const session = await getAuthenticatedSession(
          data.session.access_token,
        );
        router.replace(getPostAuthDestination(session));
        router.refresh();
        return;
      }

      if (isMountedRef.current) setConfirmationEmail(normalizedEmail);
    } catch {
      if (isMountedRef.current)
        setAuthError("Registration failed. Please check your network connection.");
    } finally {
      if (isMountedRef.current) setIsSubmitting(false);
    }
  }

  const inputStyle =
    "h-11 w-full rounded-2xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-900 shadow-2xs outline-hidden placeholder:text-slate-400 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-4 aria-invalid:ring-rose-500/15";

  return (
    <div className="relative min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100/60">
      {/* Minimal sticky navbar — consistent with SiteHeader */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-brand-red"
          aria-hidden="true"
        />
        <PageContainer className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
          <BrandLogo priority />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-brand-blue"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Back to Home
          </Link>
        </PageContainer>
      </header>

      <PageContainer className="py-(--space-content)">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
          <RegisterBenefitsSidebar />

          <section
            aria-labelledby="registration-heading"
            className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-7 lg:col-span-6 xl:col-span-5"
          >
            {confirmationEmail ? (
              <RegistrationConfirmation email={confirmationEmail} />
            ) : (
              <Stack>
                <div className="flex items-start justify-between gap-4">
                  <Stack gap="xs">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
                      First-time setup
                    </p>
                    <h2
                      id="registration-heading"
                      className="type-page-title"
                    >
                      Create student account
                    </h2>
                    <p className="text-xs leading-5 text-slate-500">
                      Already created a password?{" "}
                      <Link
                        href="/login"
                        className="font-semibold text-brand-blue hover:underline"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </Stack>
                  <div
                    className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand-blue"
                    aria-hidden="true"
                  >
                    <UserCheck className="size-5" />
                  </div>
                </div>

                <Stack gap="sm" className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
                  <GoogleSignInButton
                    label="Continue with Google"
                    onError={setAuthError}
                  />
                  <p className="text-center text-xs leading-5 text-slate-500">
                    I-Sharp students should use the email recorded by the academy.
                  </p>
                </Stack>

                <div className="relative text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <span className="relative bg-white px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    or create a password
                  </span>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="username"
                        inputMode="email"
                        placeholder="student@example.com"
                        value={email}
                        disabled={isSubmitting}
                        required
                        aria-invalid={Boolean(errors.email)}
                        aria-describedby={errors.email ? "email-error" : undefined}
                        className={cn(inputStyle, "pl-10")}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setErrors((current) => ({ ...current, email: undefined }));
                          setAuthError("");
                        }}
                      />
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                    </div>
                    {errors.email && <FieldError id="email-error" message={errors.email} />}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Create password
                    </label>
                    <PasswordInput
                      id="password"
                      name="password"
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      value={password}
                      disabled={isSubmitting}
                      required
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? "password-error" : undefined}
                      className={inputStyle}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((current) => ({ ...current, password: undefined }));
                        setAuthError("");
                      }}
                    />
                    {errors.password && <FieldError id="password-error" message={errors.password} />}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-700">
                      Confirm password
                    </label>
                    <PasswordInput
                      id="confirm-password"
                      name="confirm-password"
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      disabled={isSubmitting}
                      required
                      hasLeftIcon={false}
                      aria-invalid={Boolean(errors.confirmPassword)}
                      aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                      className={inputStyle}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setErrors((current) => ({
                          ...current,
                          confirmPassword: undefined,
                        }));
                        setAuthError("");
                      }}
                    />
                    {errors.confirmPassword && (
                      <FieldError id="confirm-password-error" message={errors.confirmPassword} />
                    )}
                  </div>

                  {authError && (
                    <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700">
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
                      {authError === "existing-account" ? (
                        <span>
                          This email already has an account.{" "}
                          <Link href="/login" className="font-semibold underline hover:no-underline">
                            Sign in here
                          </Link>
                          , or use{" "}
                          <Link href="/login?forgot=1" className="font-semibold underline hover:no-underline">
                            Forgot password
                          </Link>
                          .
                        </span>
                      ) : (
                        <span>{authError}</span>
                      )}
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-full bg-brand-red text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                  >
                    {isSubmitting ? (
                      <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldCheck className="mr-2 size-4" aria-hidden="true" />
                    )}
                    {isSubmitting ? "Creating account…" : "Create my student account"}
                  </Button>
                </form>

                <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  Your password is handled by secure authentication. I-Sharp
                  administrators cannot view it.
                </div>
              </Stack>
            )}
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="status" aria-live="polite" className="flex items-center gap-1 text-xs font-semibold text-rose-600">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
