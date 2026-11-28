"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  History,
  LoaderCircle,
  Pencil,
  Phone,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { request } from "@/components/question-bank/helpers";

export type FollowUpStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "JOINED"
  | "NOT_INTERESTED";

export interface DemoLeadRecord {
  id: string;
  normalizedPhone: string;
  verificationMethod: "MOCK" | "SMS";
  isVerified: boolean;
  verifiedAt: string;
  firstAccessAt: string;
  lastAccessAt: string;
  totalAttempts: number;
  latestScore: number | null;
  latestMaxMarks: number | null;
  latestPercentage: number | null;
  marketingConsent: boolean;
  consentTimestamp: string | null;
  followUpStatus: FollowUpStatus;
  adminNotes: string | null;
}

interface DemoLeadStats {
  totalLeads: number;
  todayLeads: number;
  completedTests: number;
  pendingFollowUp: number;
}

interface DemoLeadListResponse {
  items: DemoLeadRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface LeadAttemptRecord {
  id: string;
  status: string;
  subjectMode: string;
  languageMode: string;
  questionCount: number;
  durationMinutes: number;
  maxMarks: number;
  totalScore: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  accuracyPercentage: number | null;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt: string | null;
}

const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  JOINED: "Joined",
  NOT_INTERESTED: "Not Interested",
};

const FOLLOW_UP_BADGES: Record<FollowUpStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  INTERESTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  JOINED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOT_INTERESTED: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function DemoLeadsTab({ onNotice, onError }: Props) {
  const [stats, setStats] = useState<DemoLeadStats | null>(null);
  const [leads, setLeads] = useState<DemoLeadRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("ALL");
  const [consentFilter, setConsentFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const leadsAbortRef = useRef<AbortController | null>(null);

  // Edit / Update lead modal state
  const [editingLead, setEditingLead] = useState<DemoLeadRecord | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editConsent, setEditConsent] = useState(false);
  const [editStatus, setEditStatus] = useState<FollowUpStatus>("NEW");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete confirmation modal state
  const [deletingLead, setDeletingLead] = useState<DemoLeadRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  // Attempt history modal state
  const [historyLead, setHistoryLead] = useState<DemoLeadRecord | null>(null);
  const [historyAttempts, setHistoryAttempts] = useState<LeadAttemptRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const loadData = useCallback(async () => {
    leadsAbortRef.current?.abort();
    const controller = new AbortController();
    leadsAbortRef.current = controller;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (debouncedQuery.trim()) params.set("query", debouncedQuery.trim());
      if (followUpFilter !== "ALL") params.set("followUpStatus", followUpFilter);
      if (consentFilter !== "ALL") params.set("consent", consentFilter);
      if (dateRange?.from) {
        const fromStart = new Date(
          dateRange.from.getFullYear(),
          dateRange.from.getMonth(),
          dateRange.from.getDate(),
          0,
          0,
          0,
          0,
        );
        const endDate = dateRange.to ?? dateRange.from;
        const toStart = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          0,
          0,
          0,
          0,
        );
        params.set("from", fromStart.toISOString());
        params.set("to", toStart.toISOString());
      }

      const [nextStats, nextList] = await Promise.all([
        request<DemoLeadStats>("demo-test/leads/stats", {
          signal: controller.signal,
        }),
        request<DemoLeadListResponse>(`demo-test/leads?${params.toString()}`, {
          signal: controller.signal,
        }),
      ]);
      if (controller.signal.aborted) return;
      setStats(nextStats);
      setLeads(nextList.items);
      setTotal(nextList.total);
      setTotalPages(nextList.totalPages);
    } catch (error) {
      if (!controller.signal.aborted) {
        onError(
          error instanceof Error ? error.message : "Failed to load demo leads",
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [page, debouncedQuery, followUpFilter, consentFilter, dateRange, onError]);

  useEffect(() => {
    const id = requestAnimationFrame(() => void loadData());
    return () => {
      cancelAnimationFrame(id);
      leadsAbortRef.current?.abort();
    };
  }, [loadData]);

  const handleCopy = async (lead: DemoLeadRecord) => {
    try {
      await navigator.clipboard.writeText(lead.normalizedPhone);
      setCopiedId(lead.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      onError("Could not copy mobile number");
    }
  };

  const openEditModal = (lead: DemoLeadRecord) => {
    setEditingLead(lead);
    setEditPhone(lead.normalizedPhone);
    setEditConsent(lead.marketingConsent);
    setEditStatus(lead.followUpStatus);
    setEditNotes(lead.adminNotes ?? "");
  };

  const saveLeadUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSavingEdit(true);
    try {
      await request(`demo-test/leads/${editingLead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          normalizedPhone: editPhone,
          marketingConsent: editConsent,
          followUpStatus: editStatus,
          adminNotes: editNotes,
        }),
      });
      onNotice("Demo lead updated.");
      setEditingLead(null);
      await loadData();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to update lead",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteLead = async () => {
    if (!deletingLead) return;
    setDeletingBusy(true);
    try {
      await request(`demo-test/leads/${deletingLead.id}`, {
        method: "DELETE",
      });
      onNotice("Demo lead deleted.");
      setDeletingLead(null);
      await loadData();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to delete lead",
      );
    } finally {
      setDeletingBusy(false);
    }
  };

  const applyDatePreset = (daysBack: number) => {
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const from = new Date(to);
    from.setDate(from.getDate() - daysBack);
    setPage(1);
    setDateRange({ from, to });
    setDatePopoverOpen(false);
  };

  const dateFilterLabel = dateRange?.from
    ? dateRange.to &&
      dateRange.to.toDateString() !== dateRange.from.toDateString()
      ? `${formatDate(dateRange.from.toISOString())} – ${formatDate(dateRange.to.toISOString())}`
      : formatDate(dateRange.from.toISOString())
    : "Filter by Date";

  const hasActiveFilters = Boolean(
    query.trim() ||
      followUpFilter !== "ALL" ||
      consentFilter !== "ALL" ||
      dateRange?.from,
  );

  const openHistoryModal = async (lead: DemoLeadRecord) => {
    setHistoryLead(lead);
    setHistoryAttempts([]);
    setLoadingHistory(true);
    try {
      const res = await request<{ attempts: LeadAttemptRecord[] }>(
        `demo-test/leads/${lead.id}/attempts`,
      );
      setHistoryAttempts(res.attempts);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "Failed to load attempt history",
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 4 Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">Total Leads</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-950">
            {stats?.totalLeads ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Today&apos;s Leads
          </p>
          <p className="mt-1.5 text-2xl font-bold text-indigo-700">
            {stats?.todayLeads ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Completed Tests
          </p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-700">
            {stats?.completedTests ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            Pending Follow-up
          </p>
          <p className="mt-1.5 text-2xl font-bold text-brand-red">
            {stats?.pendingFollowUp ?? 0}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by mobile number..."
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Shadcn Date Range Filter */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
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
                    setPage(1);
                    setDateRange(undefined);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      setPage(1);
                      setDateRange(undefined);
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
                  onClick={() => applyDatePreset(0)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(6)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(29)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-2xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Last 30 Days
                </button>
                {dateRange?.from && (
                  <button
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setDateRange(undefined);
                      setDatePopoverOpen(false);
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
                onSelect={(range) => {
                  setPage(1);
                  setDateRange(range);
                }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Select
            value={followUpFilter}
            onValueChange={(value) => {
              setPage(1);
              if (value) setFollowUpFilter(value);
            }}
          >
            <SelectTrigger
              aria-label="Filter by follow-up status"
              className="h-9 text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Follow-up Statuses">All Follow-up Statuses</SelectItem>
              <SelectItem value="NEW" label="New">New</SelectItem>
              <SelectItem value="CONTACTED" label="Contacted">Contacted</SelectItem>
              <SelectItem value="INTERESTED" label="Interested">Interested</SelectItem>
              <SelectItem value="JOINED" label="Joined">Joined</SelectItem>
              <SelectItem value="NOT_INTERESTED" label="Not Interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Select
              value={consentFilter}
              onValueChange={(value) => {
                setPage(1);
                if (value) setConsentFilter(value);
              }}
            >
              <SelectTrigger
                aria-label="Filter by contact consent"
                className="h-9 flex-1 text-xs font-medium"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" label="All Consent">All Consent</SelectItem>
                <SelectItem value="GRANTED" label="Consent Granted">Consent Granted</SelectItem>
                <SelectItem value="NOT_GRANTED" label="No Consent">No Consent</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(1);
                  setQuery("");
                  setFollowUpFilter("ALL");
                  setConsentFilter("ALL");
                  setDateRange(undefined);
                }}
                title="Reset all filters"
                className="h-9 shrink-0 rounded-xl px-2.5 text-xs text-slate-600"
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Leads Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-500">
            <LoaderCircle className="size-4 animate-spin" />
            <span>Loading demo leads...</span>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <Users className="size-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">
              No demo leads found
            </p>
            <p className="text-xs text-slate-500">
              Prospective student leads will appear here after mobile OTP verification.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mobile Number</th>
                  <th className="px-4 py-3 font-semibold">First Attended</th>
                  <th className="px-4 py-3 font-semibold">Last Attended</th>
                  <th className="px-4 py-3 text-center font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Latest Score</th>
                  <th className="px-4 py-3 font-semibold">Verification</th>
                  <th className="px-4 py-3 font-semibold">Consent</th>
                  <th className="px-4 py-3 font-semibold">Follow-Up</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => {
                  const canCall =
                    lead.marketingConsent && lead.verificationMethod === "SMS";
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 font-mono font-semibold text-slate-900">
                        {lead.normalizedPhone}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(lead.firstAccessAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {formatDate(lead.lastAccessAt)}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-800">
                        {lead.totalAttempts}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                        {lead.latestScore !== null && lead.latestMaxMarks !== null
                          ? `${lead.latestScore} / ${lead.latestMaxMarks}`
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {lead.verificationMethod === "SMS" ? (
                          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
                            SMS Verified
                          </span>
                        ) : (
                          <span
                            title="Mock OTP verification does not confirm mobile ownership"
                            className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-800"
                          >
                            Mock (Dev)
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {lead.marketingConsent ? (
                          <span className="font-semibold text-emerald-700">
                            Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-2xs font-semibold ${FOLLOW_UP_BADGES[lead.followUpStatus]}`}
                        >
                          {FOLLOW_UP_LABELS[lead.followUpStatus]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void handleCopy(lead)}
                            title="Copy mobile number"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            {copiedId === lead.id ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>

                          {canCall ? (
                            <a
                              href={`tel:${lead.normalizedPhone}`}
                              title="Call prospective student"
                              className="grid size-7 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <Phone className="size-3.5" />
                            </a>
                          ) : (
                            <span
                              title={
                                !lead.marketingConsent
                                  ? "Admission call disabled: no marketing consent"
                                  : "Admission call disabled: mock-verified number"
                              }
                              className="grid size-7 cursor-not-allowed place-items-center rounded-lg border border-slate-100 bg-slate-50 text-slate-300"
                            >
                              <Phone className="size-3.5" />
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(lead)}
                            title="Edit & update lead"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void openHistoryModal(lead)}
                            title="View demo attempt history"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <History className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingLead(lead)}
                            title="Delete demo lead"
                            className="grid size-7 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <span>
              Showing page {page} of {totalPages} ({total} leads)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 gap-1 rounded-lg px-2.5 text-xs"
              >
                <ChevronLeft className="size-3.5" />
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 gap-1 rounded-lg px-2.5 text-xs"
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Edit & Update Lead Modal */}
      <Dialog
        open={Boolean(editingLead)}
        onOpenChange={(open) => !open && setEditingLead(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit &amp; Update Demo Lead</DialogTitle>
            <DialogDescription className="text-xs">
              Update mobile number, consent, follow-up status &amp; notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void saveLeadUpdate(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Mobile Number
              </label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="mt-1.5 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Follow-up Status
                </label>
                <Select
                  value={editStatus}
                  onValueChange={(value) =>
                    value && setEditStatus(value as FollowUpStatus)
                  }
                >
                  <SelectTrigger className="mt-1.5 h-9 w-full text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW" label="New">New</SelectItem>
                    <SelectItem value="CONTACTED" label="Contacted">Contacted</SelectItem>
                    <SelectItem value="INTERESTED" label="Interested">Interested</SelectItem>
                    <SelectItem value="JOINED" label="Joined">Joined</SelectItem>
                    <SelectItem value="NOT_INTERESTED" label="Not Interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Marketing Consent
                </label>
                <Select
                  value={editConsent ? "GRANTED" : "NOT_GRANTED"}
                  onValueChange={(value) => setEditConsent(value === "GRANTED")}
                >
                  <SelectTrigger className="mt-1.5 h-9 w-full text-xs font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GRANTED" label="Yes (Granted)">Yes (Granted)</SelectItem>
                    <SelectItem value="NOT_GRANTED" label="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Administrator Notes
              </label>
              <textarea
                rows={3}
                maxLength={2000}
                placeholder="Add admission follow-up notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingLead(null)}
                disabled={savingEdit}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit}
                className="gap-1.5 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover"
              >
                {savingEdit && <LoaderCircle className="size-3.5 animate-spin" />}
                Update Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(deletingLead)}
        onOpenChange={(open) => !open && !deletingBusy && setDeletingLead(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Demo Lead?</DialogTitle>
            <DialogDescription className="text-xs">
              This will permanently remove{" "}
              <span className="font-mono font-semibold text-slate-900">
                {deletingLead?.normalizedPhone}
              </span>{" "}
              from the Demo Leads directory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingLead(null)}
              disabled={deletingBusy}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={deletingBusy}
              onClick={() => void confirmDeleteLead()}
              className="gap-1.5 rounded-full bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
            >
              {deletingBusy && <LoaderCircle className="size-3.5 animate-spin" />}
              Delete Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attempt History Modal */}
      <Dialog
        open={Boolean(historyLead)}
        onOpenChange={(open) => !open && setHistoryLead(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Demo Test Attempt History</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {historyLead?.normalizedPhone}
            </DialogDescription>
          </DialogHeader>

          {loadingHistory ? (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
              <LoaderCircle className="size-4 animate-spin" />
              <span>Loading attempts...</span>
            </div>
          ) : historyAttempts.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No demo test attempts recorded for this lead yet.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {historyAttempts.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {att.subjectMode === "ALL"
                        ? "All Subjects"
                        : att.subjectMode}{" "}
                      · {att.questionCount} Qs
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-2xs text-slate-500">
                      <Clock className="size-3" />
                      {formatDateTime(att.startedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {att.totalScore !== null
                        ? `${att.totalScore} / ${att.maxMarks}`
                        : att.status}
                    </p>
                    {att.accuracyPercentage !== null && (
                      <p className="text-2xs text-slate-500">
                        Accuracy: {att.accuracyPercentage}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
