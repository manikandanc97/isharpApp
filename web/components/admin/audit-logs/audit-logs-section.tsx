"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Filter,
  History,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import type { AuditLogEntry } from "@/lib/audit-logs-store";

interface AuditLogsSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function AuditLogsSection({ onNotice, onError }: AuditLogsSectionProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page on filter or search query change
  useEffect(() => {
    setPage(1);
  }, [selectedModule, searchQuery]);

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch {
      onError("Failed to load audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredLogs = logs.filter((log) => {
    if (selectedModule !== "ALL" && log.module !== selectedModule) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actorEmail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.targetEntityName && log.targetEntityName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Actor Email", "Role", "Module", "Action", "Target", "Details", "IP Address"];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.actorEmail}"`,
      `"${l.actorRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.targetEntityName || l.targetEntityId || ""}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || ""}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `isharp-audit-logs-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotice("Audit logs exported to CSV successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <History className="size-4" /> Compliance & Accountability
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              System Audit Logs & Activity Trail
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Immutable logging of administrative operations, question bank imports, examination schedules, and access changes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => void loadData(true)}
              className="gap-1.5 rounded-full"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>Sync</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 rounded-full"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Logs Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Module Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "ALL", label: "All Modules" },
                { key: "QUESTION_BANK", label: "Question Bank" },
                { key: "COURSES", label: "Courses" },
                { key: "TEST_SERIES", label: "Test Series" },
                { key: "EXAM_MANAGEMENT", label: "Exams" },
                { key: "ROLES", label: "Roles" },
                { key: "SETTINGS", label: "Settings" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedModule(m.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedModule === m.key
                      ? "bg-brand-blue text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor & Role</th>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Details & Target</th>
                <th className="px-5 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.map((log) => {
                const moduleTone =
                  log.module === "QUESTION_BANK"
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : log.module === "COURSES"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : log.module === "EXAM_MANAGEMENT"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : log.module === "ROLES"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-3xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-semibold text-slate-900">{log.actorEmail}</span>
                        <p className="text-3xs font-bold text-slate-400">{log.actorRole}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-md border px-2 py-0.5 text-3xs font-bold ${moduleTone}`}>
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 text-3xs">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 max-w-md">
                      {log.targetEntityName && (
                        <span className="font-bold text-slate-900 mr-1.5">
                          [{log.targetEntityName}]
                        </span>
                      )}
                      <span className="text-slate-600 leading-relaxed text-xs">
                        {log.details}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-3xs text-slate-400">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No audit records found matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredLogs.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}
