"use client";

import { Globe, LogOut, User } from "lucide-react";
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
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-red via-brand-blue to-emerald-500" />
      <PageContainer
        size="workspace"
        className="flex h-(--layout-site-header-height) items-center justify-between gap-4"
      >
        {/* Brand & Academy Identifier */}
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandLogo priority className="h-8.5 w-auto sm:h-9" />
          <div className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs font-semibold text-slate-800">
              Student Portal
            </span>
            <Badge
              variant="outline"
              className={cn(
                "items-center gap-1.5 rounded-full px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wide",
                isInternal
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800"
                  : "border-indigo-200 bg-indigo-50/80 text-brand-blue",
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{studentCategory} Pass</span>
            </Badge>
          </div>
        </div>

        {/* Right Controls: Language Selector & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Segmented Language Selector */}
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50/80 p-0.5 text-xs font-semibold">
            <div className="hidden xs:flex items-center px-2 text-slate-400">
              <Globe className="size-3.5" />
            </div>
            {(
              [
                { id: "bilingual" as const, label: "EN+தமிழ்" },
                { id: "en" as const, label: "English" },
                { id: "ta" as const, label: "தமிழ்" },
              ] as const
            ).map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => onLanguageChange(lang.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-3xs sm:text-xs font-semibold transition-all cursor-pointer",
                  selectedLanguage === lang.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Open profile menu for ${displayName}`}
              className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white p-1 pr-2.5 sm:pr-3 shadow-2xs outline-none transition-all hover:border-slate-300 hover:shadow-xs cursor-pointer"
            >
              <div className="flex size-7.5 items-center justify-center rounded-full bg-gradient-to-tr from-brand-red to-rose-400 text-xs font-bold text-white shadow-xs">
                {profileInitial}
              </div>
              <div className="hidden text-left text-xs md:grid md:gap-0.5">
                <p className="max-w-36 truncate font-bold leading-none text-slate-900">
                  {displayName}
                </p>
                <p className="font-mono text-3xs text-slate-500">
                  {studentIdDisplay}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-card">
              <DropdownMenuLabel className="grid gap-1 px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {displayName}
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-3xs font-bold text-emerald-700">
                    {studentCategory}
                  </span>
                </div>
                {session?.email && (
                  <p className="truncate text-3xs text-slate-500">{session.email}</p>
                )}
                <p className="font-mono text-3xs font-semibold text-slate-600">
                  ID: {studentIdDisplay}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onOpenProfile}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium hover:bg-slate-50"
              >
                <User className="size-3.5 text-brand-blue" />
                <span>My Academic Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onPromptSignOut}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus:text-rose-700"
              >
                <LogOut className="size-3.5" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageContainer>
    </header>
  );
}
