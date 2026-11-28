"use client";

import type { FormEvent, ReactNode } from "react";
import { AlertCircle, LoaderCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import { isValidEmail } from "@/lib/validation";

const inputBaseStyle =
  "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

export interface AuthLoginFormProps {
  headingId: string;
  heading: string;
  subtitle: string;
  topBadge: ReactNode;
  topRight?: ReactNode;
  emailId: string;
  emailLabel: string;
  emailPlaceholder: string;
  email: string;
  onEmailChange: (value: string) => void;
  emailError?: string;
  onEmailBlurInvalid: (message: string) => void;
  passwordId: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  password: string;
  onPasswordChange: (value: string) => void;
  passwordError?: string;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  submittingLabel: string;
  sessionMetaRow: ReactNode;
  expiredTitle: string;
  expiredNotice?: string;
  expiredSubNotice?: string;
  authError?: string;
  statusMessage?: string;
  footer?: ReactNode;
}

export function AuthLoginForm({
  headingId,
  heading,
  subtitle,
  topBadge,
  topRight,
  emailId,
  emailLabel,
  emailPlaceholder,
  email,
  onEmailChange,
  emailError,
  onEmailBlurInvalid,
  passwordId,
  passwordLabel,
  passwordPlaceholder,
  password,
  onPasswordChange,
  passwordError,
  isSubmitting,
  onSubmit,
  submitLabel,
  submittingLabel,
  sessionMetaRow,
  expiredTitle,
  expiredNotice,
  expiredSubNotice,
  authError,
  statusMessage,
  footer,
}: AuthLoginFormProps) {
  return (
    <section
      aria-labelledby={headingId}
      className="w-full min-w-0 max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        {topBadge}
        {topRight}
      </div>

      <div className="mt-2">
        <h2 id={headingId} className="type-page-title text-slate-900">
          {heading}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>

      <form className="mt-3.5 space-y-2.5 sm:space-y-3" onSubmit={onSubmit} noValidate>
        <div className="space-y-1">
          <label
            htmlFor={emailId}
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            {emailLabel}
          </label>
          <div className="relative">
            <input
              id={emailId}
              name={emailId}
              type="email"
              inputMode="email"
              autoComplete="username"
              placeholder={emailPlaceholder}
              value={email}
              disabled={isSubmitting}
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError ? `${emailId}-error` : undefined}
              className={cn(inputBaseStyle, "pl-9")}
              onChange={(event) => onEmailChange(event.target.value)}
              onBlur={() => {
                const trimmed = email.trim();
                if (trimmed && !isValidEmail(trimmed)) {
                  onEmailBlurInvalid("Enter a valid email address.");
                }
              }}
            />
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
          {emailError && (
            <p
              id={`${emailId}-error`}
              role="alert"
              className="flex items-center gap-1 text-xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor={passwordId}
            className="block text-xs sm:text-sm font-semibold text-slate-700"
          >
            {passwordLabel}
          </label>
          <PasswordInput
            id={passwordId}
            name={passwordId}
            autoComplete="current-password"
            placeholder={passwordPlaceholder}
            value={password}
            disabled={isSubmitting}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? `${passwordId}-error` : undefined}
            onChange={(event) => onPasswordChange(event.target.value)}
          />
          {passwordError && (
            <p
              id={`${passwordId}-error`}
              role="alert"
              className="flex items-center gap-1 text-xs font-medium text-rose-600"
            >
              <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              <span>{passwordError}</span>
            </p>
          )}
        </div>

        {sessionMetaRow}

        {expiredNotice && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50/90 p-3 text-xs leading-snug text-amber-900 shadow-2xs"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-amber-600"
            />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-950">{expiredTitle}</p>
              <p className="text-amber-800">{expiredNotice}</p>
              {expiredSubNotice && (
                <p className="font-tamil text-[11px] text-amber-700">
                  {expiredSubNotice}
                </p>
              )}
            </div>
          </div>
        )}

        {authError && (
          <div
            role="alert"
            className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-xs leading-snug text-rose-700"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0 text-rose-600"
            />
            <p>{authError}</p>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="flex gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/90 p-2 text-xs leading-snug text-emerald-800"
          >
            <p>{statusMessage}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-10.5 w-full cursor-pointer rounded-full bg-brand-red hover:bg-brand-red-hover text-xs sm:text-sm font-semibold text-white shadow-primary transition hover:shadow-md active:scale-95 disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 size-3.5 animate-spin" />
              <span>{submittingLabel}</span>
            </>
          ) : (
            <span>{submitLabel}</span>
          )}
        </Button>
      </form>

      {footer}
    </section>
  );
}
