"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function RegistrationConfirmation({ email }: { email: string }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-8" />
      </div>
      <h2 className="mt-4 type-page-title text-slate-900">
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
        Continue to sign in <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

