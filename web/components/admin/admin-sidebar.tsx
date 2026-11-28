"use client";

import Link from "next/link";
import { LoaderCircle, LogOut, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { initials } from "@/components/admin/admin-helpers";
import {
  platformOperationSections,
  sectionMeta,
  sectionPaths,
  systemConfigurationSections,
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
  onNavigate: _onNavigate,
  pendingNotificationCount,
  administratorLabel,
  session,
  signingOut,
  onOpenLogoutDialog,
}: AdminSidebarProps) {
  const isItemActive = (key: Section) => {
    if (section === key) return true;
    if (key === "test-series" && section === "tests") return true;
    return false;
  };

  const renderNavGroup = (title: string, keys: Section[]) => (
    <div className="space-y-1">
      <div className="mb-2 px-3 text-3xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {keys.map((key) => {
        const meta = sectionMeta[key];
        const Icon = meta.icon;
        const isActive = isItemActive(key);
        const badgeCount =
          key === "students" ? pendingNotificationCount : 0;
        return (
          <Link
            key={key}
            href={sectionPaths[key]}
            scroll={false}
            onClick={onCloseSidebar}
            className={`group flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all ${
              isActive
                ? "bg-brand-blue text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-950"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                }`}
              >
                <Icon className="size-4" />
              </div>
              <span className="truncate text-xs font-semibold leading-tight">
                {meta.label}
              </span>
            </div>
            {badgeCount > 0 && (
              <span
                className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isActive
                    ? "bg-brand-red text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

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

        {/* Section Navigation Links with Clean Module Separation */}
        <div className="sidebar-scrollbar flex-1 space-y-6 overflow-y-auto px-4 py-5 pr-3">
          {renderNavGroup("Platform Operations", platformOperationSections)}

          <div className="border-t border-slate-100 pt-3">
            {renderNavGroup("System Configuration", systemConfigurationSections)}
          </div>
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
