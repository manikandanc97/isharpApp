"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentDashboardStatus } from "./use-student-dashboard";

interface StudentAccessGateProps {
  status: StudentDashboardStatus;
  statusMessage: string;
  onSignOut: () => void;
}

export function StudentAccessGate({
  status,
  statusMessage,
  onSignOut,
}: StudentAccessGateProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 selection:bg-brand-red selection:text-white antialiased">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-8 text-center shadow-card sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-brand-red">
          <AlertCircle className="size-7" />
        </div>
        <h2 className="mt-5 type-section-title text-slate-900">
          {status === "unauthenticated"
            ? "Authentication Required"
            : status === "payment-required"
              ? "Academic Plan Required"
              : status === "forbidden"
                ? "403 — Unauthorized Role"
                : "Service Connection Error"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {status === "payment-required"
            ? statusMessage ||
              "I-Sharp internal students get full complimentary access. External aspirants require an active subscription."
            : status === "unauthenticated"
              ? "Please sign in with your verified academy account to access your student portal."
              : statusMessage ||
                "You do not have the required student access role."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {status === "payment-required" ? (
            <Button
              render={
                <Link
                  href="/plans"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-2.5 text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                >
                  <span>View 2026 Access Plans</span>
                  <ChevronRight className="size-4" />
                </Link>
              }
            />
          ) : (
            <Button
              render={
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-red py-2.5 text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                >
                  <span>Return to Academy Login</span>
                  <ChevronRight className="size-4" />
                </Link>
              }
            />
          )}
          <Button
            variant="outline"
            onClick={onSignOut}
            className="rounded-full border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Sign out session
          </Button>
        </div>
      </div>
    </div>
  );
}

