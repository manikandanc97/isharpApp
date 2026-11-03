import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Skeleton } from "@/components/ui/skeleton";

export type AdminSkeletonSection = "overview" | "students" | "courses";

const sectionLabels: Record<AdminSkeletonSection, string> = {
  overview: "Overview",
  students: "Students",
  courses: "Courses",
};

export function AdminWorkspaceContentSkeleton({
  section = "overview",
}: {
  section?: AdminSkeletonSection;
}) {
  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. SECTION: STUDENTS (Matches Image 2 exactly)
      ───────────────────────────────────────────────────────────── */}
      {section === "students" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          {/* Panel Header */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Student accounts
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Search student logins, inspect access and suspend or restore eligible students.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-brand-red px-3.5 py-2 text-xs font-bold text-white shadow-xs">
              <UserPlus className="size-3.5" />
              <span>Add internal student</span>
            </div>
          </div>

          {/* Search Box & Counter Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <div className="flex h-10 w-full items-center rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3">
                <span className="text-xs text-slate-400">
                  Search name or student ID…
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-800">0</span> of 0 students
            </span>
          </div>

          {/* Filter Pills Row */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-brand-blue bg-brand-blue px-3 py-1.5 text-xs font-bold text-white shadow-xs">
              All students
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
              Internal
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
              External
            </span>
          </div>

          {/* 7-Column Table */}
          <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-4xl text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-2xs uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 font-bold">User</th>
                  <th className="py-3 px-4 font-bold">Student ID</th>
                  <th className="py-3 px-4 font-bold">Role</th>
                  <th className="py-3 px-4 font-bold">Student Type</th>
                  <th className="py-3 px-4 font-bold">Verification</th>
                  <th className="py-3 px-4 font-bold">Access</th>
                  <th className="py-3 px-4 text-right font-bold">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {[1, 2, 3, 4, 5].map((row) => (
                  <tr key={row} className="hover:bg-slate-50/60">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-full bg-rose-50" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32 rounded-md" />
                          <Skeleton className="h-2.5 w-24 rounded-md" />
                        </div>
                      </div>
                    </td>
                    {/* Student ID */}
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-3.5 w-20 rounded-md" />
                    </td>
                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-16 rounded border border-slate-200 bg-slate-50" />
                    </td>
                    {/* Student Type */}
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-20 rounded-full bg-indigo-50" />
                    </td>
                    {/* Verification */}
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-16 rounded-full bg-emerald-50" />
                    </td>
                    {/* Access */}
                    <td className="py-3.5 px-4">
                      <Skeleton className="h-5 w-14 rounded-full bg-emerald-50" />
                    </td>
                    {/* Control */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end">
                        <Skeleton className="h-7 w-16 rounded-lg border border-slate-200" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SECTION: OVERVIEW
      ───────────────────────────────────────────────────────────── */}
      {section === "overview" && (
        <div className="space-y-7">
          {/* Executive Welcome Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-7">
            <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/50 px-3 py-1 text-xs font-semibold text-rose-700">
                  <Sparkles className="size-3 text-brand-red" />
                  <span>Admin Console</span>
                  <span className="h-3 w-px bg-slate-200" />
                  <span className="font-bold text-brand-red">Live Operations</span>
                </div>
                <h2 className="mt-2.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Good to see you, Admin
                </h2>
                <p className="mt-1 max-w-xl text-sm text-slate-500">
                  Here is what is happening across i-SHARP today. Review pending
                  student identity claims and supervise institutional courses.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white shadow-primary">
                  <span>Review Verification Queue</span>
                  <ArrowRight className="size-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Total students */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Total students</p>
                  <Skeleton className="mt-2 h-8 w-16 rounded-md" />
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-brand-red">
                  <Users className="size-5" />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2">
                <Skeleton className="h-4 w-20 rounded-full bg-emerald-50" />
                <span className="text-2xs text-slate-400">registered learners</span>
              </div>
            </div>

            {/* Internal students */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Internal students</p>
                  <Skeleton className="mt-2 h-8 w-16 rounded-md" />
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
                  <Clock3 className="size-5" />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded-full bg-amber-50" />
                <span className="text-2xs text-slate-400">automatic free access</span>
              </div>
            </div>

            {/* Active courses */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Active courses</p>
                  <Skeleton className="mt-2 h-8 w-16 rounded-md" />
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <BookOpen className="size-5" />
                </div>
              </div>
              <div className="mt-3.5 flex items-center gap-2">
                <Skeleton className="h-4 w-24 rounded-full bg-emerald-50" />
                <span className="text-2xs text-slate-400">syllabus offerings</span>
              </div>
            </div>

            {/* Platform access */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Platform access</p>
                  <Skeleton className="mt-2 h-8 w-16 rounded-md" />
                </div>
                <div className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700">
                  <BarChart3 className="size-5" />
                </div>
              </div>
              <div className="mt-3">
                <Skeleton className="h-1.5 w-full rounded-full" />
                <div className="mt-2 flex justify-between text-2xs text-slate-400">
                  <span>Active accounts</span>
                  <Skeleton className="h-3 w-12 rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Pipeline & Quick Controls */}
          <div className="grid gap-5 xl:grid-cols-12">
            {/* Left 7 cols: Verification Activity */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs xl:col-span-7">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Recent student access activity
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Latest internal and external student access records
                  </p>
                </div>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
                  View queue
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-full bg-rose-50" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-36 rounded-md" />
                        <Skeleton className="h-3 w-28 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full bg-emerald-50" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: Quick Controls */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs xl:col-span-5">
              <div className="mb-5">
                <h3 className="text-base font-black text-slate-900">Quick controls</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Administrative shortcuts and frequent navigation
                </p>
              </div>
              <div className="grid gap-3">
                {[
                  { title: "Review student IDs", sub: "Manage internal emails", icon: UserCheck },
                  { title: "Manage accounts", sub: "User directory", icon: Users },
                  { title: "Manage curriculum", sub: "Curriculum tracks", icon: GraduationCap },
                ].map((ctl, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        <ctl.icon className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{ctl.title}</p>
                        <p className="text-2xs text-slate-500">{ctl.sub}</p>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SECTION: COURSES (Matches real Courses layout & brand tokens)
      ───────────────────────────────────────────────────────────── */}
      {section === "courses" && (
        <div className="space-y-8">
          <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_16px_45px_-36px_rgba(15,23,42,0.45)]">
            {/* Header matching real layout */}
            <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-7 sm:px-7 lg:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-blue">
                    <BookOpenCheck className="size-3.5" />
                    Academic operations
                  </div>
                  <h2 className="text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
                    Curriculum workspace
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Govern course availability, syllabus coverage and academic content
                    from one operational view.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-brand-red px-4 py-2.5 text-xs font-bold text-white shadow-primary">
                  <Plus className="size-4" />
                  <span>Create course</span>
                </div>
              </div>
            </div>

            {/* 4 Metric counters strip */}
            <div className="grid border-b border-slate-200 bg-white sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total courses", icon: BookOpen, tone: "text-brand-blue bg-blue-50" },
                { label: "Published", icon: Check, tone: "text-emerald-700 bg-emerald-50" },
                { label: "Subjects mapped", icon: BookOpenCheck, tone: "text-violet-700 bg-violet-50" },
                { label: "Chapters indexed", icon: GraduationCap, tone: "text-rose-700 bg-rose-50" },
              ].map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
                  >
                    <div className={`grid size-10 place-items-center rounded-lg ${metric.tone}`}>
                      <Icon className="size-4.5" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-6 w-12 rounded-md" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {metric.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter Bar & Course Registry */}
            <div className="bg-[#fdfdfc] p-5 sm:p-7">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-950">
                    Course registry
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Curriculum records
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="relative min-w-0 sm:w-72">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <div className="flex h-10 w-full items-center rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-400">
                      Search code or course name
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-brand-blue bg-brand-blue px-3 py-1.5 text-xs font-bold text-white">
                      All courses
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                      Published
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                      Archived
                    </span>
                  </div>
                </div>
              </div>

              {/* Course list articles matching real row structure */}
              <div className="mt-5 space-y-3">
                {[1, 2, 3].map((card) => (
                  <article
                    key={card}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 lg:p-6"
                  >
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.85fr)_auto] lg:items-center">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-brand-blue ring-1 ring-blue-100">
                          <BookOpen className="size-5.5" />
                        </div>
                        <div className="min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-16 rounded-md bg-slate-100" />
                            <Skeleton className="h-5 w-20 rounded-full bg-emerald-50" />
                          </div>
                          <Skeleton className="h-5 w-48 rounded-md" />
                          <Skeleton className="h-3.5 w-64 rounded-md" />
                        </div>
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <span>Curriculum coverage</span>
                          <Skeleton className="h-3 w-16 rounded-sm" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Skeleton className="h-6 w-20 rounded-lg" />
                          <Skeleton className="h-6 w-24 rounded-lg" />
                          <Skeleton className="h-6 w-16 rounded-lg" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <div className="text-right">
                          <Skeleton className="ml-auto h-5 w-8 rounded-sm" />
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Subjects
                          </p>
                        </div>
                        <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-blue bg-brand-blue px-3.5 text-xs font-bold text-white">
                          <Check className="size-3.5" />
                          Publish
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

interface AdminLayoutSkeletonProps {
  section?: AdminSkeletonSection;
  showSidebar?: boolean;
}

export function AdminLayoutSkeleton({
  section = "overview",
  showSidebar = true,
}: AdminLayoutSkeletonProps) {
  const currentLabel = sectionLabels[section];

  return (
    <div className="relative min-h-svh overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased">
      {/* ─────────────────────────────────────────────────────────────
          1. EXACT ADMIN SIDEBAR
      ───────────────────────────────────────────────────────────── */}
      {showSidebar && (
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white shadow-xs lg:flex">
          {/* Header */}
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
            <BrandLogo priority className="h-8 w-auto" />
          </div>

          {/* Operational Status Indicator */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50/80 px-3.5 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
                </span>
                <span className="text-2xs font-bold text-slate-700">Command Engine</span>
              </div>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-emerald-700">
                Active
              </span>
            </div>
          </div>

          {/* Workspace Nav Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="px-3 text-2xs font-bold uppercase tracking-eyebrow text-slate-400">
              Workspace
            </p>
            <nav className="mt-2.5 space-y-1.5">
              {[
                {
                  key: "overview",
                  label: "Overview",
                  sub: "Metrics & telemetry",
                  icon: LayoutDashboard,
                },
                {
                  key: "students",
                  label: "Students",
                  sub: "0 accounts",
                  icon: Users,
                },
                {
                  key: "courses",
                  label: "Courses",
                  sub: "0 courses",
                  icon: BookOpen,
                },
              ].map((item) => {
                const isActive = section === item.key;
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition ${
                      isActive
                        ? "bg-brand-red text-white shadow-primary"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold tracking-tight ${
                          isActive ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p
                        className={`text-2xs ${
                          isActive ? "text-rose-100" : "text-slate-400"
                        }`}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Bottom Administrator Profile Card */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-blue text-white shadow-xs">
                <ShieldCheck className="size-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-bold text-slate-900">
                    Administrator
                  </p>
                  <span className="rounded bg-rose-50 px-1 py-0.2 text-3xs font-black uppercase tracking-wider text-brand-red">
                    ROOT
                  </span>
                </div>
                <p className="truncate text-2xs text-slate-500">ADMIN</p>
              </div>
            </div>
            <div className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold text-slate-500">
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </div>
          </div>
        </aside>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT AREA WITH EXACT TOPBAR
      ───────────────────────────────────────────────────────────── */}
      <div className={showSidebar ? "lg:pl-72" : ""}>
        {/* Sticky Executive Topbar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-8 shadow-2xs">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xs font-bold uppercase tracking-label text-brand-red">
                  Admin Console
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-2xs font-bold uppercase tracking-label text-slate-400">
                  {currentLabel}
                </span>
              </div>
              <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900">
                {currentLabel}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Operational Status */}
            <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1 sm:flex shadow-2xs">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-600" />
              </span>
              <span className="text-xs font-semibold text-slate-700">
                Live Operational Data
              </span>
            </div>

            {/* Refresh Button */}
            <div className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs">
              <RefreshCw className="size-4" />
            </div>

            {/* Notification Bell */}
            <div className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs">
              <Bell className="size-4" />
            </div>

            {/* Profile Pill */}
            <div className="ml-1 hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1.5 sm:flex shadow-2xs">
              <div className="grid size-7 place-items-center rounded-full bg-blue-50 text-brand-blue">
                <CircleUserRound className="size-4.5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Admin</span>
              <ChevronDown className="size-3 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="mx-auto max-w-7xl p-4 sm:p-8">
          <AdminWorkspaceContentSkeleton section={section} />
        </main>
      </div>
    </div>
  );
}
