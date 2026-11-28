import { useCallback, useEffect, useRef, useState } from "react";
import type { DateRange } from "react-day-picker";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { request } from "@/components/question-bank/helpers";
import type {
  DemoLeadListResponse,
  DemoLeadRecord,
  DemoLeadStats,
  FollowUpStatus,
  LeadAttemptRecord,
} from "./demo-leads.types";

interface UseDemoLeadsOptions {
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function useDemoLeads({ onNotice, onError }: UseDemoLeadsOptions) {
  const [stats, setStats] = useState<DemoLeadStats | null>(null);
  const [leads, setLeads] = useState<DemoLeadRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [followUpFilter, setFollowUpFilter] = useState("ALL");
  const [consentFilter, setConsentFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const leadsAbortRef = useRef<AbortController | null>(null);

  const [editingLead, setEditingLead] = useState<DemoLeadRecord | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editConsent, setEditConsent] = useState(false);
  const [editStatus, setEditStatus] = useState<FollowUpStatus>("NEW");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingLead, setDeletingLead] = useState<DemoLeadRecord | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const [historyLead, setHistoryLead] = useState<DemoLeadRecord | null>(null);
  const [historyAttempts, setHistoryAttempts] = useState<LeadAttemptRecord[]>(
    [],
  );
  const [loadingHistory, setLoadingHistory] = useState(false);

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
      if (followUpFilter !== "ALL") {
        params.set("followUpStatus", followUpFilter);
      }
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

  const applyDatePreset = (daysBack: number) => {
    const today = new Date();
    const to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const from = new Date(to);
    from.setDate(from.getDate() - daysBack);
    setPage(1);
    setDateRange({ from, to });
    setDatePopoverOpen(false);
  };

  const resetFilters = () => {
    setPage(1);
    setQuery("");
    setFollowUpFilter("ALL");
    setConsentFilter("ALL");
    setDateRange(undefined);
  };

  return {
    stats,
    leads,
    page,
    setPage,
    totalPages,
    total,
    loading,
    query,
    setQuery,
    followUpFilter,
    setFollowUpFilter,
    consentFilter,
    setConsentFilter,
    dateRange,
    setDateRange,
    datePopoverOpen,
    setDatePopoverOpen,
    copiedId,
    editingLead,
    setEditingLead,
    editPhone,
    setEditPhone,
    editConsent,
    setEditConsent,
    editStatus,
    setEditStatus,
    editNotes,
    setEditNotes,
    savingEdit,
    deletingLead,
    setDeletingLead,
    deletingBusy,
    historyLead,
    setHistoryLead,
    historyAttempts,
    loadingHistory,
    handleCopy,
    openEditModal,
    saveLeadUpdate,
    confirmDeleteLead,
    openHistoryModal,
    applyDatePreset,
    resetFilters,
  };
}
