"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Eye,
  EyeOff,
  Headphones,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAuthenticatedSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type AdminRole = "admin" | "faculty";

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

export function AdminLoginForm() {
  const [role, setRole] = useState<AdminRole>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Authenticated State (Admin Dashboard Preview)
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    email: string;
    role: string;
    displayName: string;
  } | null>(null);

  function validate() {
    const errs: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errs.email = "Enter your official academy email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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
      const supabase = getSupabaseClient(rememberMe);

      if (!supabase) {
        setAuthError(
          "Authentication is not configured. Contact I-Sharp Academy IT support.",
        );
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanedEmail,
        password,
      });
      if (error || !data.user || !data.session?.access_token) {
        setAuthError(
          error?.message?.toLowerCase().includes("invalid login credentials")
            ? "Invalid email or password. Verify credentials or contact academy superadmin."
            : error?.message || "Authentication failed. Please verify credentials.",
        );
        return;
      }

      const session = await getAuthenticatedSession(data.session.access_token);
      const isSuperadmin = session.roles.includes("SUPERADMIN");
      const isAdmin = session.roles.includes("ADMIN");
      if (!isAdmin && !isSuperadmin) {
        await supabase.auth.signOut();
        setAuthError(
          "This account does not have an administrator role assigned by the API.",
        );
        return;
      }

      setAuthenticatedUser({
        email: data.user.email || cleanedEmail,
        role: isSuperadmin ? "Super Administrator" : "Academy Administrator",
        displayName: data.user.user_metadata?.display_name || "Administrator",
      });
    } catch {
      setAuthError("Authentication service connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // If user is authenticated, render the Admin Control Center
  if (authenticatedUser) {
    return (
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-[#191747] text-white">
              <ShieldCheck className="size-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{authenticatedUser.displayName}</p>
              <p className="text-3xs font-medium text-slate-500">{authenticatedUser.role}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 text-3xs font-semibold">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
            Active Session
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-600">
            Welcome to the <strong className="text-slate-900">I-Sharp Academy Control Center</strong>. All management tools are synchronized.
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Total Enrolments</p>
              <p className="text-lg font-black text-slate-900">1,000+</p>
              <p className="text-3xs text-emerald-600 font-medium">Batch 2026 Active</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
              <p className="text-3xs font-semibold text-slate-400 uppercase tracking-wider">Simulated Mocks</p>
              <p className="text-lg font-black text-slate-900">25 Tests</p>
              <p className="text-3xs text-[#2525b8] font-medium">720-Mark NTA Pattern</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[#2525b8]" />
                <span className="font-semibold">Student Enrolment Approvals</span>
              </div>
              <Badge className="bg-rose-100 text-[#e51d35] text-3xs border-none font-bold">New</Badge>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-emerald-600" />
                <span className="font-semibold">Question Bank &amp; DPP Management</span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400" />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-amber-600" />
                <span className="font-semibold">Test Series Schedule &amp; Key Verification</span>
              </div>
              <ArrowRight className="size-3.5 text-slate-400" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              ← Back to Academy
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const supabase = getSupabaseClient(true);
                if (supabase) supabase.auth.signOut();
                setAuthenticatedUser(null);
                setPassword("");
              }}
              className="text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <LogOut className="size-3.5 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inputBaseStyle =
    "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-[#2525b8] focus:ring-3 focus:ring-[#2525b8]/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <section
      aria-labelledby="admin-login-heading"
      className="w-full min-w-0 max-w-sm sm:max-w-md rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-[0_8px_30px_-10px_rgba(15,23,42,0.08)]"
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-3xs font-bold tracking-wider text-slate-800 uppercase">
          <Shield className="size-3 text-slate-700" />
          <span>Restricted Portal</span>
        </div>
        <div className="flex items-center gap-1.5 text-3xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SSO Ready</span>
        </div>
      </div>

      <div className="mt-2.5">
        <h2 id="admin-login-heading" className="text-lg font-extrabold text-slate-900 sm:text-xl">
          Faculty &amp; Administration
        </h2>
        <p className="text-2xs text-slate-500">
          Sign in to access curriculum management, question banks &amp; telemetry.
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="mt-3.5 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
        <button
          type="button"
          onClick={() => {
            setRole("admin");
            setAuthError("");
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
            role === "admin"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <ShieldCheck className="size-3.5 text-[#191747]" />
          <span>Administrator</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRole("faculty");
            setAuthError("");
          }}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer",
            role === "faculty"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <UserCheck className="size-3.5 text-[#2525b8]" />
          <span>Faculty &amp; Staff</span>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-3.5 space-y-3" noValidate>
        {/* Email or Staff ID */}
        <div className="space-y-1">
          <label htmlFor="admin-email" className="block text-2xs sm:text-xs font-semibold text-slate-700">
            {role === "admin" ? "Administrator Email *" : "Faculty Staff Email *"}
          </label>
          <div className="relative">
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              autoComplete="username"
              placeholder={role === "admin" ? "admin@isharpacademy.in" : "faculty@isharpacademy.in"}
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
                  setErrors((prev) => ({ ...prev, email: "Email is required." }));
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                  setErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
                }
              }}
            />
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1 text-2xs font-medium text-rose-600">
              <AlertCircle className="size-3 shrink-0" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Security Password */}
        <div className="space-y-1">
          <label htmlFor="admin-pass" className="block text-2xs sm:text-xs font-semibold text-slate-700">
            Security Passcode *
          </label>
          <div className="relative">
            <input
              id="admin-pass"
              name="admin-pass"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your security passcode"
              value={password}
              disabled={isSubmitting}
              className={cn(inputBaseStyle, "pl-9 pr-10")}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
                setAuthError("");
              }}
            />
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="flex items-center gap-1 text-2xs font-medium text-rose-600">
              <AlertCircle className="size-3 shrink-0" />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember Session & Help */}
        <div className="flex items-center justify-between pt-0.5 text-2xs text-slate-600">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 rounded border-slate-300 text-[#191747] accent-[#191747]"
            />
            <span>Remember secure session</span>
          </label>
          <span className="text-3xs text-slate-400">256-Bit Encrypted</span>
        </div>

        {/* Error Alert */}
        {authError && (
          <div role="alert" className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-2xs leading-snug text-rose-700">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-rose-600" />
            <p>{authError}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="mt-1 h-10.5 w-full cursor-pointer rounded-full bg-[#191747] hover:bg-[#2525b8] text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:shadow-md active:scale-[0.99] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-3.5 animate-spin mr-2" />
              <span>Verifying Credentials…</span>
            </>
          ) : (
            <span>Sign In to {role === "admin" ? "Administration" : "Faculty Portal"}</span>
          )}
        </Button>
      </form>

      {/* Switch to Student Portal */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
        <span className="text-slate-400">Enrolled Student?</span>
        <Link href="/login" className="font-semibold text-[#2525b8] hover:underline">
          Go to Student LMS →
        </Link>
      </div>

      {/* Help Helpline */}
      <div className="mt-2.5 flex items-center justify-center gap-1 text-3xs text-slate-400">
        <Headphones className="size-2.5 text-slate-400" />
        <span>IT Desk Helpline:</span>
        <a href="tel:+919894850370" className="font-semibold text-slate-600 hover:text-slate-900 hover:underline">
          +91 98948 50370
        </a>
      </div>
    </section>
  );
}

