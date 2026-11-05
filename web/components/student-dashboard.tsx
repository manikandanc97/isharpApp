"use client";

import {
  AlertCircle,
  Award,
  BarChart3,
  Bell,
  BookCheck,
  BookOpen,
  ChevronRight,
  Flame,
  LogOut,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import {
  PageContainer,
  Stack,
} from "@/components/layout/layout-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DppDrillDialog } from "@/components/student/dpp-drill-dialog";
import { StudentProfileDialog } from "@/components/student/student-profile-dialog";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";
import { LuxuryDashboardSkeleton } from "@/components/student/student-skeleton";
import type { LanguageMode, TabId } from "@/components/student/student-types";
import { StudentAnalyticsTab } from "@/components/student/tabs/student-analytics-tab";
import { StudentDppTab } from "@/components/student/tabs/student-dpp-tab";
import { StudentMocksTab } from "@/components/student/tabs/student-mocks-tab";
import { StudentOverviewTab } from "@/components/student/tabs/student-overview-tab";
import { StudentSubjectsTab } from "@/components/student/tabs/student-subjects-tab";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { hasRequiredRole } from "@/lib/role-policy";
import { cn } from "@/lib/utils";

function LayoutTabIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

export function StudentDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [status, setStatus] = useState<
    "loading" | "ready" | "unauthenticated" | "forbidden" | "payment-required" | "error"
  >("loading");
  const [statusMessage, setStatusMessage] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageMode>("bilingual");

  // Interactive DPP Drill Runner state
  const [drillOpen, setDrillOpen] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [solvedCount, setSolvedCount] = useState(12);

  // Logout confirmation modal state
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Authenticate session and check student RBAC access
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionResponse = await fetch("/api/session", { cache: "no-store" });
        if (sessionResponse.status === 401) {
          if (active) setStatus("unauthenticated");
          return;
        }
        if (!sessionResponse.ok) throw new Error("Authentication API connection failed");
        const currentSession = (await sessionResponse.json()) as AuthenticatedSession;
        if (active) setSession(currentSession);

        if (!hasRequiredRole(currentSession.roles, "STUDENT")) {
          if (active) setStatus("forbidden");
          return;
        }

        const accessResponse = await fetch("/api/access/student", { cache: "no-store" });
        const payload = (await accessResponse.json()) as { message?: string };
        if (accessResponse.status === 401) {
          if (active) setStatus("unauthenticated");
          return;
        }
        if (accessResponse.status === 403) {
          if (active) {
            setStatusMessage(payload.message ?? "An active access plan is required");
            setStatus("payment-required");
          }
          return;
        }
        if (!accessResponse.ok) throw new Error(payload.message ?? "API connection failed");
        if (active) {
          setStatusMessage(payload.message ?? "API access confirmed");
          setStatus("ready");
        }
      } catch (error) {
        if (active) {
          setStatusMessage(error instanceof Error ? error.message : "API connection failed");
          setStatus("error");
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  async function confirmSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setLogoutDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  function promptSignOut() {
    setLogoutDialogOpen(true);
  }

  function openProfile() {
    setProfileName(session?.displayName ?? "");
    setProfileError("");
    setProfileOpen(true);
  }

  async function saveProfile() {
    const displayName = profileName.trim();
    if (!displayName) {
      setProfileError("Please enter your name");
      return;
    }
    if (displayName.length > 150) {
      setProfileError("Name must be 150 characters or fewer");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        displayName?: string;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.message ?? "Unable to update profile");
      setSession((current) =>
        current
          ? { ...current, displayName: payload.displayName ?? displayName }
          : current,
      );
      setProfileOpen(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  // Display user details
  const studentCategory = session?.studentAccess?.category ?? "INTERNAL";
  const isInternal = studentCategory === "INTERNAL";
  const displayName = session?.displayName?.trim() || "Student";
  const studentIdDisplay = session?.studentAccess?.studentId || "Student ID unavailable";
  const profileInitial = displayName.charAt(0).toUpperCase();
  const greetingName = displayName.split(/\s+/)[0];

  // Loading Skeleton State
  if (status === "loading") {
    return <LuxuryDashboardSkeleton />;
  }

  // Access Error / Payment Required States
  if (status !== "ready") {
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
              ? statusMessage || "I-Sharp internal students get full complimentary access. External aspirants require an active subscription."
              : status === "unauthenticated"
                ? "Please sign in with your verified academy account to access your student portal."
                : statusMessage || "You do not have the required student access role."}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {status === "payment-required" ? (
              <Button
                render={
                  <Link
                    href="/plans"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red py-2.5 text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                  >
                    <span>Return to Academy Login</span>
                    <ChevronRight className="size-4" />
                  </Link>
                }
              />
            )}
            <Button
              variant="outline"
              onClick={promptSignOut}
              className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Sign out session
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fc] font-sans text-slate-900 antialiased selection:bg-brand-red selection:text-white">
      {/* 01. PRESTIGIOUS LUXURY TOP NAVIGATION */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-red via-brand-blue to-brand-red" />
        
        <PageContainer size="workspace" className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
          {/* Left Brand & Academic Identification */}
          <div className="flex items-center gap-3 sm:gap-5">
            <BrandLogo priority className="h-8.5 w-auto sm:h-9" />
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="hidden items-center gap-1.5 rounded-full border-slate-200 bg-slate-50/80 px-3 py-1 text-xs font-semibold text-slate-800 md:inline-flex"
              >
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Batch 2026</span>
                <span className="text-slate-300">•</span>
                <span className="text-brand-red font-semibold">NEET &amp; JEE</span>
              </Badge>

              <Badge
                variant="outline"
                className={cn(
                  "hidden items-center gap-1.5 rounded-full px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wide xs:inline-flex sm:text-xs",
                  isInternal
                    ? "border-emerald-200 bg-emerald-50/70 text-emerald-800"
                    : "border-indigo-200 bg-indigo-50/70 text-brand-blue"
                )}
              >
                <ShieldCheck className="size-3" />
                <span>{isInternal ? "Internal Scholar" : "Active Subscriber"}</span>
              </Badge>
            </div>
          </div>

          {/* Right Controls: Streak, Notifications, Language, Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Daily Streak Flame Pill */}
            <div
              className="hidden items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50/80 px-3 py-1 text-xs font-semibold text-amber-900 shadow-2xs transition-transform hover:scale-105 xs:inline-flex"
              title="14 Consecutive Days of Consistent Practice"
            >
              <Flame className="size-4 fill-amber-500 text-amber-500 animate-bounce" />
              <span>14 Days</span>
            </div>

            {/* Language Switcher Pill */}
            <div className="hidden items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold sm:flex">
              <button
                type="button"
                onClick={() => setSelectedLanguage("bilingual")}
                className={cn(
                  "rounded-full px-2.5 py-1 transition-all",
                  selectedLanguage === "bilingual"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                தமிழ் + Eng
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={cn(
                  "rounded-full px-2 py-1 transition-all",
                  selectedLanguage === "en"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("ta")}
                className={cn(
                  "rounded-full px-2 py-1 transition-all",
                  selectedLanguage === "ta"
                    ? "bg-white text-slate-900 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                தமிழ்
              </button>
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              className="relative rounded-full border border-slate-200/80 bg-white p-2 text-slate-600 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-brand-red ring-2 ring-white" />
            </button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Open profile menu for ${displayName}`}
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1 pr-3 shadow-2xs hover:border-slate-300 outline-none transition-all"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-red to-rose-400 text-xs font-semibold text-white shadow-xs">
                  {profileInitial}
                </div>
                <div className="hidden text-left text-xs lg:grid lg:gap-0.5">
                  <p className="max-w-36 truncate font-semibold leading-none text-slate-900">{displayName}</p>
                  <p className="font-mono text-3xs text-slate-500">{studentIdDisplay}</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-card">
                <DropdownMenuLabel className="grid gap-1 px-3 py-2">
                  <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
                  {session?.email && (
                    <p className="truncate text-3xs text-slate-500">{session.email}</p>
                  )}
                  <p className="font-mono text-3xs text-slate-500">{studentIdDisplay}</p>
                  <Badge variant="outline" className="w-fit border-rose-200 bg-rose-50/50 text-3xs font-semibold text-brand-red">
                    {studentCategory} Access
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={openProfile}
                  className="flex cursor-pointer items-center gap-2 text-xs font-medium"
                >
                  <User className="size-3.5 text-brand-blue" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/plans")}
                  className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Manage Subscription</span>
                </DropdownMenuItem>
                {session?.roles.includes("ADMIN") && (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                  >
                    <ShieldCheck className="size-3.5 text-brand-blue" />
                    <span>Switch to Admin Panel</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={promptSignOut}
                  className="flex items-center gap-2 text-xs font-semibold text-rose-600 focus:text-rose-700 cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </PageContainer>
      </header>

      {/* 02. MAIN CONTENT CONTAINER */}
      <main className="flex-1">
        <PageContainer size="workspace" className="py-(--space-content)">
          <Stack gap="lg">
        {/* Luxury Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/60 to-rose-50/30 p-(--layout-card-padding) shadow-card">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 size-72 rounded-full bg-gradient-to-bl from-brand-red/8 via-brand-blue/5 to-transparent blur-3xl pointer-events-none" />
          <Stack gap="lg" className="relative">

          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <Stack gap="sm">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                <span className="size-2 rounded-full bg-brand-red animate-pulse" />
                <span>Premier Bilingual NEET &amp; JEE Preparation</span>
                <span className="text-slate-300">•</span>
                <span className="text-brand-red font-semibold">இன்றைய இலக்கு (Today&apos;s Target)</span>
              </div>

              <h1 className="type-page-title text-slate-900">
                வணக்கம், {greetingName}! Top percentile-ஐ நோக்கி முன்னேறுங்கள்.
              </h1>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                Consistency is key: 15 Daily DPP Drills, Calibrated 720-mark NTA Mocks, and
                uncompromised concept clarity in <strong className="text-slate-900 font-semibold">தமிழ் + English</strong>.
              </p>
            </Stack>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                onClick={() => setDrillOpen(true)}
                className="group rounded-full bg-brand-red px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary transition-all duration-200 hover:bg-brand-red-hover active:scale-95"
              >
                <Zap className="mr-1.5 size-4 transition-transform group-hover:scale-110" />
                <span>Resume Daily DPP</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setActiveTab("mocks")}
                className="rounded-full border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-all hover:border-brand-blue/40 hover:text-brand-blue active:scale-95"
              >
                <BookCheck className="mr-1.5 size-4 text-brand-blue" />
                <span>Mock Test Arena</span>
              </Button>
            </div>
          </div>

          {/* 03. LUXURY METRICS GRID (4 HIGHLIGHT CARDS) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: DPP Drills */}
            <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                  Daily DPP Drills
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-rose-50 text-brand-red">
                  <Zap className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-metric text-slate-900">{solvedCount} / 15</span>
                <span className="text-xs font-semibold text-emerald-600">80% Solved</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-red to-rose-400 transition-all duration-500"
                  style={{ width: `${(solvedCount / 15) * 100}%` }}
                />
              </div>
              <p className="flex items-center justify-between text-3xs text-slate-500">
                <span>3 questions to keep streak</span>
                <span className="font-semibold text-slate-700">Ends 11:59 PM</span>
              </p>
            </div>

            {/* Metric 2: Estimated Score */}
            <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                  Simulated NTA Score
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-brand-blue">
                  <Award className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-metric text-slate-900">648</span>
                <span className="text-xs font-medium text-slate-500">/ 720</span>
                <Badge variant="outline" className="ml-auto text-3xs font-semibold border-emerald-200 bg-emerald-50 text-emerald-700">
                  Top 2.5%
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-3xs font-semibold text-emerald-600">
                <TrendingUp className="size-3" />
                <span>+28 marks vs previous grand mock</span>
              </div>
              <p className="text-3xs text-slate-500">Calibrated against 2024–25 NTA criteria</p>
            </div>

            {/* Metric 3: Accuracy */}
            <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                  Accuracy Index
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Target className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="type-metric text-slate-900">88.5%</span>
                <span className="text-xs font-semibold text-slate-500">Target: 90%+</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "88.5%" }} />
              </div>
              <p className="flex items-center justify-between text-3xs text-slate-500">
                <span>Negative Marks Minimized</span>
                <span className="font-semibold text-rose-600">-8 Marks</span>
              </p>
            </div>

            {/* Metric 4: Access Status */}
            <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold uppercase tracking-wide text-slate-500">
                  Academy Status
                </span>
                <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="size-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-lg font-semibold text-slate-900">
                  {isInternal ? "Internal Scholar" : "Full Access Plan"}
                </span>
              </div>
              <p className="font-mono text-xs font-semibold text-brand-red">{studentIdDisplay}</p>
              <p className="flex items-center justify-between text-3xs text-slate-500">
                <span>Valid: Academic 2026</span>
                <span className="font-semibold text-emerald-700">Verified</span>
              </p>
            </div>
          </div>
          </Stack>
        </section>

        {/* 04. LUXURY NAVIGATION TABS */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
            {[
              { id: "overview", label: "Overview & Daily Plan", icon: LayoutTabIcon },
              { id: "dpp", label: "Daily DPP Drills (15 Qs)", icon: Zap },
              { id: "mocks", label: "Mock Test Arena (720M)", icon: BookCheck },
              { id: "subjects", label: "Curriculum & Subjects", icon: BookOpen },
              { id: "analytics", label: "Analytics & Rank", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabId)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-150",
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("size-3.5", isActive ? "text-white" : "text-slate-500")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 05. TAB PANELS */}
        <div>
          {activeTab === "overview" && (
            <StudentOverviewTab
              onOpenDrill={() => setDrillOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "dpp" && (
            <StudentDppTab
              onOpenDrill={() => setDrillOpen(true)}
              selectedAnswer={selectedAnswer}
              setSelectedAnswer={setSelectedAnswer}
              showExplanation={showExplanation}
              setShowExplanation={setShowExplanation}
            />
          )}

          {activeTab === "mocks" && <StudentMocksTab />}

          {activeTab === "subjects" && (
            <StudentSubjectsTab onOpenDrill={() => setDrillOpen(true)} />
          )}

          {activeTab === "analytics" && <StudentAnalyticsTab />}
        </div>
          </Stack>
        </PageContainer>
      </main>

      <StudentProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        session={session}
        profileName={profileName}
        setProfileName={setProfileName}
        profileError={profileError}
        savingProfile={savingProfile}
        onSave={saveProfile}
      />

      <DppDrillDialog
        open={drillOpen}
        onOpenChange={setDrillOpen}
        currentQIndex={currentQIndex}
        setCurrentQIndex={setCurrentQIndex}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        showExplanation={showExplanation}
        setShowExplanation={setShowExplanation}
        setSolvedCount={setSolvedCount}
      />

      <LogoutConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        onConfirm={confirmSignOut}
        isLoading={isSigningOut}
        title="Log out of Student Portal?"
        description="Are you sure you want to log out? You will need to sign in again to access your daily DPP drills, mock tests, and performance analytics."
      />
    </div>
  );
}
