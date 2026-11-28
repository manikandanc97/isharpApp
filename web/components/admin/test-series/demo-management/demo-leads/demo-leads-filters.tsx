"use client";

import type { DateRange } from "react-day-picker";
import { CalendarIcon, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLeadDate } from "./demo-leads.types";

interface DemoLeadsFiltersProps {
  query: string;
  onQueryChange: (value: string) => void;
  followUpFilter: string;
  onFollowUpFilterChange: (value: string) => void;
  consentFilter: string;
  onConsentFilterChange: (value: string) => void;
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  datePopoverOpen: boolean;
  onDatePopoverOpenChange: (open: boolean) => void;
  onApplyDatePreset: (daysBack: number) => void;
  onResetFilters: () => void;
}

export function DemoLeadsFilters({
  query,
  onQueryChange,
  followUpFilter,
  onFollowUpFilterChange,
  consentFilter,
  onConsentFilterChange,
  dateRange,
  onDateRangeChange,
  datePopoverOpen,
  onDatePopoverOpenChange,
  onApplyDatePreset,
  onResetFilters,
}: DemoLeadsFiltersProps) {
  const dateFilterLabel = dateRange?.from
    ? dateRange.to &&
      dateRange.to.toDateString() !== dateRange.from.toDateString()
      ? `${formatLeadDate(dateRange.from.toISOString())} – ${formatLeadDate(dateRange.to.toISOString())}`
      : formatLeadDate(dateRange.from.toISOString())
    : "Filter by Date";

  const hasActiveFilters = Boolean(
    query.trim() ||
      followUpFilter !== "ALL" ||
      consentFilter !== "ALL" ||
      dateRange?.from,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by mobile number..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
          />
        </div>

        <Popover open={datePopoverOpen} onOpenChange={onDatePopoverOpenChange}>
          <PopoverTrigger
            className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl border px-3 text-xs font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
              dateRange?.from
                ? "border-indigo-300 bg-indigo-50/50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <CalendarIcon className="size-3.5 shrink-0 opacity-70" />
              <span className="truncate">{dateFilterLabel}</span>
            </span>
            {dateRange?.from && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date filter"
                onClick={(e) => {
                  e.stopPropagation();
                  onDateRangeChange(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onDateRangeChange(undefined);
                  }
                }}
                className="rounded p-0.5 hover:bg-indigo-100"
              >
                <X className="size-3" />
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 px-3 py-2">
              <button
                type="button"
                onClick={() => onApplyDatePreset(0)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => onApplyDatePreset(6)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => onApplyDatePreset(29)}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Last 30 Days
              </button>
              {dateRange?.from && (
                <button
                  type="button"
                  onClick={() => {
                    onDateRangeChange(undefined);
                    onDatePopoverOpenChange(false);
                  }}
                  className="ml-auto rounded-lg px-2 py-1 text-2xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Clear
                </button>
              )}
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => onDateRangeChange(range)}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={followUpFilter}
          onValueChange={(value) => value && onFollowUpFilterChange(value)}
        >
          <SelectTrigger
            aria-label="Filter by follow-up status"
            className="h-9 text-xs font-medium"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All Follow-up Statuses">
              All Follow-up Statuses
            </SelectItem>
            <SelectItem value="NEW" label="New">
              New
            </SelectItem>
            <SelectItem value="CONTACTED" label="Contacted">
              Contacted
            </SelectItem>
            <SelectItem value="INTERESTED" label="Interested">
              Interested
            </SelectItem>
            <SelectItem value="JOINED" label="Joined">
              Joined
            </SelectItem>
            <SelectItem value="NOT_INTERESTED" label="Not Interested">
              Not Interested
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Select
            value={consentFilter}
            onValueChange={(value) => value && onConsentFilterChange(value)}
          >
            <SelectTrigger
              aria-label="Filter by contact consent"
              className="h-9 flex-1 text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Consent">
                All Consent
              </SelectItem>
              <SelectItem value="GRANTED" label="Consent Granted">
                Consent Granted
              </SelectItem>
              <SelectItem value="NOT_GRANTED" label="No Consent">
                No Consent
              </SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              title="Reset all filters"
              className="h-9 shrink-0 rounded-xl px-2.5 text-xs text-slate-600"
            >
              <X className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
