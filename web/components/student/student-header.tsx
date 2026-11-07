"use client";

import { Bell, Flame, LogOut, ShieldCheck, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { PageContainer } from "@/components/layout/layout-primitives";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthenticatedSession } from "@/lib/auth-session";
import { cn } from "@/lib/utils";
import type { LanguageMode } from "./student-types";

interface StudentHeaderProps {
  session: AuthenticatedSession | null;
  isInternal: boolean;
  selectedLanguage: LanguageMode;
  onLanguageChange: (lang: LanguageMode) => void;
  displayName: string;
  studentIdDisplay: string;
  studentCategory: string;
  profileInitial: string;
  onOpenProfile: () => void;
  onPromptSignOut: () => void;
}

export function StudentHeader({
  session,
  isInternal,
  selectedLanguage,
  onLanguageChange,
  displayName,
  studentIdDisplay,
  studentCategory,
  profileInitial,
  onOpenProfile,
  onPromptSignOut,
}: StudentHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-red via-brand-blue to-brand-red" />

      <PageContainer
        size="workspace"
        className="flex h-(--layout-site-header-height) items-center justify-between gap-4"
      >
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
                  : "border-indigo-200 bg-indigo-50/70 text-brand-blue",
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
              onClick={() => onLanguageChange("bilingual")}
              className={cn(
                "rounded-full px-2.5 py-1 transition-all",
                selectedLanguage === "bilingual"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              தமிழ் + Eng
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("en")}
              className={cn(
                "rounded-full px-2 py-1 transition-all",
                selectedLanguage === "en"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange("ta")}
              className={cn(
                "rounded-full px-2 py-1 transition-all",
                selectedLanguage === "ta"
                  ? "bg-white text-slate-900 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-900",
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
                <p className="max-w-36 truncate font-semibold leading-none text-slate-900">
                  {displayName}
                </p>
                <p className="font-mono text-3xs text-slate-500">
                  {studentIdDisplay}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-2xl p-1.5 shadow-card"
            >
              <DropdownMenuLabel className="grid gap-1 px-3 py-2">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {displayName}
                </p>
                {session?.email && (
                  <p className="truncate text-3xs text-slate-500">
                    {session.email}
                  </p>
                )}
                <p className="font-mono text-3xs text-slate-500">
                  {studentIdDisplay}
                </p>
                <Badge
                  variant="outline"
                  className="w-fit border-rose-200 bg-rose-50/50 text-3xs font-semibold text-brand-red"
                >
                  {studentCategory} Access
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpenProfile}
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
                onClick={onPromptSignOut}
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
  );
}

