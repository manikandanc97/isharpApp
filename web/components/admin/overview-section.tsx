"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import {
  formatDate,
  initials,
  LightLuxuryPanel,
  LightStatusBadge,
  QuickControlButton,
} from "./admin-helpers";
import type {
  Course,
  Membership,
  Metrics,
  Section,
  User,
} from "./admin-types";
import { Stack } from "@/components/layout/layout-primitives";

export interface OverviewSectionProps {
  overview: { metrics: Metrics; recentVerifications: Membership[] };
  users: User[];
  courses: Course[];
  onNavigate: (section: Section) => void;
}

export function OverviewSection({
  overview,
  users,
  courses,
  onNavigate,
}: OverviewSectionProps) {
  const accessRate = overview.metrics.users
    ? Math.round((overview.metrics.activeUsers / overview.metrics.users) * 100)
    : 0;

  return (
    <div className="space-y-7">
      {/* Executive Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Stack gap="sm">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-700">
              <Sparkles className="size-3 text-brand-red" />
              <span>Admin Console</span>
              <span className="h-3 w-px bg-slate-200" />
              <span className="font-semibold text-brand-red">Live Operations</span>
            </div>
            <h2 className="type-page-title text-slate-900">
              Good to see you, Admin
            </h2>
            <p className="max-w-xl text-sm text-slate-500">
              Here is what is happening across i-SHARP today. Review pending
              student identity claims and supervise institutional courses.
            </p>
          </Stack>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("students")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-red hover:bg-brand-red-hover px-4 py-2.5 text-xs font-semibold text-white shadow-primary transition active:scale-95"
            >
              <span>Review Verification Queue</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards - Modern Luxury Light Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Students - Primary Brand Spotlight */}
        <div className="group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-rose-300 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Total students
              </p>
              <p className="type-metric text-slate-900">
                {overview.metrics.users}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-brand-red">
              <Users className="size-5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {overview.metrics.activeUsers} active
            </span>
            <span className="text-xs text-slate-400">registered learners</span>
          </div>
        </div>

        {/* Card 2: Pending Reviews */}
        <div className="group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-amber-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Internal students
              </p>
              <p className="type-metric text-slate-900">
                {
                  users.filter(
                    (user) =>
                      user.institutionMembership?.studentCategory ===
                      "INTERNAL",
                  ).length
                }
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 className="size-5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {users.some(
              (user) =>
                user.institutionMembership?.studentCategory === "INTERNAL",
            ) ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                Requires attention
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <Check className="size-3" /> All verified
              </span>
            )}
            <span className="text-xs text-slate-400">
              automatic free access
            </span>
          </div>
        </div>

        {/* Card 3: Active Courses */}
        <div className="group relative flex flex-col gap-3.5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-emerald-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Active courses
              </p>
              <p className="type-metric text-slate-900">
                {overview.metrics.courses}
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <BookOpen className="size-5" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {overview.metrics.subjects} subjects
            </span>
            <span className="text-xs text-slate-400">syllabus offerings</span>
          </div>
        </div>

        {/* Card 4: Platform Access */}
        <div className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition duration-200 hover:border-rose-200 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Platform access
              </p>
              <p className="type-metric text-slate-900">
                {accessRate}%
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700">
              <BarChart3 className="size-5" />
            </div>
          </div>
          <div className="grid gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-red transition-all duration-500"
                style={{ width: `${accessRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Active accounts</span>
              <span className="font-semibold text-slate-600">
                {overview.metrics.activeUsers}/{overview.metrics.users || 1}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Pipeline & Quick Controls */}
      <div className="grid gap-5 xl:grid-cols-12">
        {/* Verification Activity Panel */}
        <LightLuxuryPanel
          className="xl:col-span-7"
          title="Recent student access activity"
          description="Latest internal and external student access records"
          action="View queue"
          onAction={() => onNavigate("students")}
        >
          <div className="divide-y divide-slate-100">
            {overview.recentVerifications.length ? (
              overview.recentVerifications.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-semibold text-brand-red">
                      {initials(item.user.displayName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {item.user.displayName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.studentId} · {formatDate(item.updatedAt)}
                      </p>
                    </div>
                  </div>
                  <LightStatusBadge status={item.status} />
                </div>
              ))
            ) : (
              <div className="grid justify-items-center gap-3 py-12 text-center">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                  <ShieldCheck className="size-6 text-emerald-600" />
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-semibold text-slate-800">
                    No student access activity yet
                  </p>
                  <p className="text-xs text-slate-500">
                    All student membership claims have been processed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </LightLuxuryPanel>

        {/* Quick Controls */}
        <LightLuxuryPanel
          className="xl:col-span-5"
          title="Quick controls"
          description="Administrative shortcuts and frequent navigation"
        >
          <div className="grid gap-3">
            <QuickControlButton
              icon={UserCheck}
              title="Review student IDs"
              subtitle="Manage internal emails"
              onClick={() => onNavigate("students")}
            />
            <QuickControlButton
              icon={Users}
              title="Manage accounts"
              subtitle={`${users.length} loaded`}
              onClick={() => onNavigate("students")}
            />
            <QuickControlButton
              icon={GraduationCap}
              title="Manage curriculum"
              subtitle={`${courses.length} courses`}
              onClick={() => onNavigate("courses")}
            />
          </div>
        </LightLuxuryPanel>
      </div>
    </div>
  );
}

