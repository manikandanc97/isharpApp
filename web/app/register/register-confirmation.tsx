"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function RegistrationConfirmation({ email }: { email: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the confirmation heading so screen readers announce the
  // state change after the form is replaced.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="py-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600" aria-hidden="true">
        <CheckCircle2 className="size-8" />
      </div>
      {/* id="registration-heading" keeps the outer section's aria-labelledby valid */}
      <h2
        id="registration-heading"
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 type-page-title text-slate-900 outline-hidden"
      >
        Verification email sent
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        We sent a confirmation link to{" "}
        <strong className="text-slate-900">{email}</strong>. Open the link to
        complete your registration and enter the student portal.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-red px-6 text-sm font-semibold text-white shadow-primary transition hover:bg-brand-red-hover"
      >
        Continue to sign in <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
