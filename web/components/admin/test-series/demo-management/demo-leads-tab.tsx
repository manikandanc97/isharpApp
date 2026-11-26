"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  History,
  LoaderCircle,
  MessageSquarePlus,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [followUpFilter, setFollowUpFilter] = useState("ALL");
  const [consentFilter, setConsentFilter] = useState("ALL");

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Follow-up modal state
  const [editingLead, setEditingLead] = useState<DemoLeadRecord | null>(null);
  const [editStatus, setEditStatus] = useState<FollowUpStatus>("NEW");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Attempt history modal state
  const [historyLead, setHistoryLead] = useState<DemoLeadRecord | null>(null);
  const [historyAttempts, setHistoryAttempts] = useState<LeadAttemptRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });
      if (query.trim()) params.set("query", query.trim());
      if (followUpFilter !== "ALL") params.set("followUpStatus", followUpFilter);
      if (consentFilter !== "ALL") params.set("consent", consentFilter);

      const [nextStats, nextList] = await Promise.all([
        request<DemoLeadStats>("demo-test/leads/stats"),
        request<DemoLeadListResponse>(`demo-test/leads?${params.toString()}`),
      ]);
      setStats(nextStats);
      setLeads(nextList.items);
      setTotal(nextList.total);
      setTotalPages(nextList.totalPages);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to load demo leads",
      );
    } finally {
      setLoading(false);
    }
  }, [page, query, followUpFilter, consentFilter, onError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
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

  const openFollowUpModal = (lead: DemoLeadRecord) => {
    setEditingLead(lead);
    setEditStatus(lead.followUpStatus);
    setEditNotes(lead.adminNotes ?? "");
  };

  const saveFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSavingEdit(true);
    try {
      await request(`demo-test/leads/${editingLead.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          followUpStatus: editStatus,
          adminNotes: editNotes,
        }),
      });
      onNotice("Lead follow-up updated.");
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
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

          <Select
            value={consentFilter}
            onValueChange={(value) => {
              setPage(1);
              if (value) setConsentFilter(value);
            }}
          >
            <SelectTrigger
              aria-label="Filter by contact consent"
              className="h-9 text-xs font-medium"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" label="All Consent">All Consent</SelectItem>
              <SelectItem value="GRANTED" label="Consent Granted">Consent Granted</SelectItem>
              <SelectItem value="NOT_GRANTED" label="No Consent">No Consent</SelectItem>
            </SelectContent>
          </Select>
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
              <thead className="border-b border-slate-200 bg-slate-50 text-2xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Mobile Number</th>
                  <th className="px-4 py-3">First Attended</th>
                  <th className="px-4 py-3">Last Attended</th>
                  <th className="px-4 py-3 text-center">Attempts</th>
                  <th className="px-4 py-3">Latest Score</th>
                  <th className="px-4 py-3">Verification</th>
                  <th className="px-4 py-3">Consent</th>
                  <th className="px-4 py-3">Follow-up</th>
                  <th className="px-4 py-3 text-right">Actions</th>
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
                            onClick={() => openFollowUpModal(lead)}
                            title="Update follow-up status & notes"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <MessageSquarePlus className="size-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void openHistoryModal(lead)}
                            title="View demo attempt history"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          >
                            <History className="size-3.5" />
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

      {/* Follow-up Modal */}
      {editingLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={(e) => void saveFollowUp(e)}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  Update Lead Follow-up
                </h4>
                <p className="text-xs font-mono text-slate-500">
                  {editingLead.normalizedPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

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
                <SelectTrigger className="mt-1.5 h-9 text-xs font-medium">
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingLead(null)}
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
                Save Follow-up
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Attempt History Modal */}
      {historyLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-950">
                  Demo Test Attempt History
                </h4>
                <p className="text-xs font-mono text-slate-500">
                  {historyLead.normalizedPhone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryLead(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-4" />
              </button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  );
}
