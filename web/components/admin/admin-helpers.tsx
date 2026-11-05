"use client";

import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { Membership } from "./admin-types";
import { Stack } from "@/components/layout/layout-primitives";

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const firstItem = (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => {
      if (totalPages <= 5) return index + 1;
      const start = Math.min(Math.max(page - 2, 1), totalPages - 4);
      return start + index;
    },
  );

  return (
    <nav
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      aria-label="Table pagination"
    >
      <p className="text-xs font-semibold text-slate-500">
        Showing <span className="font-semibold text-slate-800">{firstItem}</span>–
        <span className="font-semibold text-slate-800">{lastItem}</span> of{" "}
        <span className="font-semibold text-slate-800">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`grid size-9 place-items-center rounded-lg border text-xs font-semibold transition ${
              pageNumber === page
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"
            }`}
            aria-label={`Go to page ${pageNumber}`}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </nav>
  );
}

export function LightLuxuryPanel({
  title,
  description,
  action,
  onAction,
  headerAction,
  className = "",
  children,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
  headerAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white p-(--layout-card-padding) shadow-xs ${className}`}
    >
      <Stack>
      <div className="flex items-start justify-between gap-4">
        <Stack gap="xs">
          <h3 className="type-card-title text-slate-900">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </Stack>
        {headerAction ??
          (action && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-brand-blue-hover hover:underline"
            >
              <span>{action}</span>
              <ChevronRight className="size-3.5" />
            </button>
          ))}
      </div>
      {children}
      </Stack>
    </section>
  );
}

export function QuickControlButton({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-left transition hover:border-blue-200 hover:bg-blue-50/50 active:scale-95"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-9 place-items-center rounded-lg bg-blue-50 text-brand-blue transition group-hover:bg-brand-blue group-hover:text-white">
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-brand-blue transition-colors">
            {title}
          </p>
          <p className="truncate text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
      <ArrowRight className="size-3.5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-blue" />
    </button>
  );
}

export function LightSearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block w-full max-w-md">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-brand-blue focus:bg-white focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

export function LightField({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`grid gap-1.5 ${className}`}>
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
      />
    </label>
  );
}

export function LightStatusBadge({ status }: { status: Membership["status"] }) {
  const styles = {
    PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
    VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-red-50 text-red-700 ring-red-200",
    REVOKED: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ${styles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "VERIFIED"
            ? "bg-emerald-500"
            : status === "PENDING"
              ? "bg-amber-500"
              : status === "REJECTED"
                ? "bg-red-500"
                : "bg-slate-400"
        }`}
      />
      {titleCase(status)}
    </span>
  );
}

export function LightEmpty({ text }: { text: string }) {
  return (
    <div className="py-10 text-center text-xs font-semibold text-slate-400">
      {text}
    </div>
  );
}
