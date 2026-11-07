"use client";

import { LoaderCircle, LogOut, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { initials } from "@/components/admin/admin-helpers";
import {
  sectionMeta,
  type Section,
} from "@/components/admin/admin-types";
import type { AuthenticatedSession } from "@/lib/auth-session";

interface AdminSidebarProps {
  sidebarOpen: boolean;
  onCloseSidebar: () => void;
  section: Section;
  onNavigate: (section: Section) => void;
  pendingNotificationCount: number;
  administratorLabel: string;
  session: AuthenticatedSession | null;
  signingOut: boolean;
  onOpenLogoutDialog: () => void;
}

export function AdminSidebar({
  sidebarOpen,
  onCloseSidebar,
  section,
  onNavigate,
  pendingNotificationCount,
  administratorLabel,
  session,
  signingOut,
  onOpenLogoutDialog,
}: AdminSidebarProps) {
  return (
    <>
      {/* SOLID SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-(--layout-sidebar-width) flex-col border-r border-slate-200 bg-white shadow-xs transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header with Brand Logo */}
        <div className="flex h-(--layout-app-header-height) items-center justify-between border-b border-slate-100 px-(--layout-page-inline)">
          <BrandLogo priority className="h-9 w-auto" />
          <button
            onClick={onCloseSidebar}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Section Navigation Links */}
        <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-3xs font-semibold uppercase tracking-wide text-slate-400">
            Platform Operations
          </div>
          {(Object.keys(sectionMeta) as Section[]).map((key) => {
            const meta = sectionMeta[key];
            const Icon = meta.icon;
            const isActive = section === key;
            const badgeCount =
              key === "students" ? pendingNotificationCount : 0;
            return (
              <button
                key={key}
                onClick={() => {
                  onNavigate(key);
                  onCloseSidebar();
                }}
                className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-3 text-left transition-all ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-8 place-items-center rounded-lg transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-semibold leading-none">
                      {meta.label}
                    </p>
                    <p
                      className={`text-3xs ${
                        isActive ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      {meta.description}
                    </p>
                  </div>
                </div>
                {badgeCount > 0 && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-brand-red text-white"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Administrator Profile */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs font-semibold text-brand-blue">
                {initials(administratorLabel)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {administratorLabel}
                </p>
                <p className="truncate text-3xs text-slate-400">
                  {session?.roles.join(" · ") || "ADMIN"}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenLogoutDialog}
              disabled={signingOut}
              title="Sign out securely"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-600 hover:shadow-xs"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={onCloseSidebar}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-xs lg:hidden"
        />
      )}
    </>
  );
}

