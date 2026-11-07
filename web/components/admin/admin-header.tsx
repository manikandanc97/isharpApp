"use client";

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, initials, LightStatusBadge } from "./admin-helpers";
import {
  sectionMeta,
  type Membership,
  type Section,
} from "./admin-types";
import type { AuthenticatedSession } from "@/lib/auth-session";

interface AdminHeaderProps {
  section: Section;
  onOpenSidebar: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  pendingNotificationCount: number;
  recentPendingVerifications: Membership[];
  onNavigate: (section: Section) => void;
  administratorLabel: string;
  session: AuthenticatedSession | null;
  signingOut: boolean;
  onOpenLogoutDialog: () => void;
}

export function AdminHeader({
  section,
  onOpenSidebar,
  refreshing,
  onRefresh,
  pendingNotificationCount,
  recentPendingVerifications,
  onNavigate,
  administratorLabel,
  session,
  signingOut,
  onOpenLogoutDialog,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-(--layout-app-header-height) items-center justify-between border-b border-slate-200/80 bg-white/95 px-(--layout-page-inline) backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation sidebar"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Admin Console
            </span>
          </div>
          <h1 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
            {sectionMeta[section].label}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={onRefresh}
          className="h-8 gap-1.5 rounded-full border-slate-200/90 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs"
        >
          <RefreshCw
            className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">
            {refreshing ? "Syncing…" : "Refresh"}
          </span>
        </Button>

        {/* Notification drop */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="relative grid size-8 place-items-center rounded-lg border border-slate-200/90 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 hover:text-slate-800 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-blue/30 cursor-pointer"
            aria-label="Open notifications"
          >
            <Users className="size-4" />
            {pendingNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-amber-500 text-3xs font-semibold text-white shadow-xs">
                {pendingNotificationCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
            style={{ width: "min(24rem, calc(100vw - 2rem))" }}
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Student verifications
                  </p>
                  <p className="text-xs text-slate-500">
                    Manual review queue
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {pendingNotificationCount} pending
                </span>
              </div>
            </div>

            <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto p-2">
              {recentPendingVerifications.length ? (
                recentPendingVerifications.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onNavigate("students")}
                    className="cursor-pointer items-start gap-3 rounded-xl p-3 focus:bg-slate-50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-amber-50 text-xs font-semibold text-amber-800">
                      {initials(item.user.displayName)}
                    </span>
                    <span className="grid min-w-0 flex-1 gap-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-slate-900">
                          {item.user.displayName}
                        </span>
                        <LightStatusBadge status={item.status} />
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        Student ID: {item.studentId}
                      </span>
                      <span className="block text-3xs text-slate-400">
                        Updated {formatDate(item.updatedAt)}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem
                  onClick={() => onNavigate("students")}
                  className="cursor-pointer items-center justify-between rounded-xl p-3 text-left focus:bg-slate-50"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Check className="size-4" />
                    </span>
                    <span className="block">
                      <span className="block text-xs font-semibold text-slate-900">
                        Queue clear
                      </span>
                      <span className="block text-xs text-slate-500">
                        No student claims require action
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="size-3.5 text-slate-300" />
                </DropdownMenuItem>
              )}
            </div>

            <DropdownMenuSeparator className="m-0" />
            <div className="p-2">
              <DropdownMenuItem
                onClick={() => onNavigate("students")}
                className="cursor-pointer justify-center rounded-lg px-3 py-2.5 text-xs font-semibold text-brand-blue focus:bg-blue-50 focus:text-brand-blue"
              >
                Open student management
                <ArrowRight className="ml-1 size-3.5" />
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Administrator account menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group ml-0.5 flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-2 pl-1.5 shadow-2xs outline-none transition hover:border-brand-blue/40 focus-visible:ring-2 focus-visible:ring-brand-blue/30 data-popup-open:border-brand-blue/40 sm:ml-1 sm:pr-3"
            aria-label="Open administrator account menu"
          >
            <span className="grid size-7 place-items-center rounded-full bg-blue-50 text-brand-blue">
              <CircleUserRound className="size-4.5" />
            </span>
            <span className="hidden text-xs font-semibold text-slate-800 sm:inline">
              Admin
            </span>
            <ChevronDown className="hidden size-3 text-slate-400 transition-transform group-data-popup-open:rotate-180 sm:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
            style={{ width: "min(19rem, calc(100vw - 2rem))" }}
          >
            <div className="px-2 py-2.5">
              <div className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue text-white shadow-xs">
                  <ShieldCheck className="size-4.5" />
                </span>
                <span className="grid min-w-0 gap-0.5">
                  <span className="block truncate text-sm font-semibold text-slate-950">
                    {administratorLabel}
                  </span>
                  <span className="block truncate text-3xs text-slate-500">
                    {session?.roles.join(" · ") || "ADMIN"} · Secure session
                  </span>
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onNavigate("overview")}
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
            >
              <LayoutDashboard className="size-4 text-slate-500" />
              Dashboard overview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate("students")}
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
            >
              <Users className="size-4 text-slate-500" />
              Student management
              {pendingNotificationCount > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-3xs font-semibold text-amber-800">
                  {pendingNotificationCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onNavigate("courses")}
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold focus:bg-blue-50"
            >
              <BookOpen className="size-4 text-slate-500" />
              Course management
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onOpenLogoutDialog}
              disabled={signingOut}
              variant="destructive"
              className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-semibold"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {signingOut ? "Signing out…" : "Sign out securely"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

