"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  LoaderCircle,
  Pencil,
  Phone,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FOLLOW_UP_BADGES,
  FOLLOW_UP_LABELS,
  formatLeadDate,
  type DemoLeadRecord,
} from "./demo-leads.types";

interface DemoLeadsTableProps {
  leads: DemoLeadRecord[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  copiedId: string | null;
  onPageChange: (page: number) => void;
  onCopy: (lead: DemoLeadRecord) => void;
  onEdit: (lead: DemoLeadRecord) => void;
  onOpenHistory: (lead: DemoLeadRecord) => void;
  onDelete: (lead: DemoLeadRecord) => void;
}

export function DemoLeadsTable({
  leads,
  loading,
  page,
  totalPages,
  total,
  copiedId,
  onPageChange,
  onCopy,
  onEdit,
  onOpenHistory,
  onDelete,
}: DemoLeadsTableProps) {
  return (
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
            Prospective student leads will appear here after mobile OTP
            verification.
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
                <th className="px-4 py-3 text-center font-semibold">
                  Attempts
                </th>
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
                      {formatLeadDate(lead.firstAccessAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatLeadDate(lead.lastAccessAt)}
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
                          onClick={() => onCopy(lead)}
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
                          onClick={() => onEdit(lead)}
                          title="Edit & update lead"
                          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenHistory(lead)}
                          title="View demo attempt history"
                          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        >
                          <History className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(lead)}
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
              onClick={() => onPageChange(Math.max(1, page - 1))}
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
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              className="h-8 gap-1 rounded-lg px-2.5 text-xs"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
