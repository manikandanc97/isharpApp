"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import type { RoleDefinition } from "@/app/api/admin/roles/route";

interface RolesSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function RolesSection({ onNotice, onError }: RolesSectionProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matrixPage, setMatrixPage] = useState(1);
  const matrixPageSize = 10;

  const permissionsMatrix = useMemo(
    () => [
      { module: "Course & Curriculum (91 Ch)", super: true, admin: true, acad: true, ques: false, exam: false, eval: false, stud: false },
      { module: "Question Bank & Import", super: true, admin: true, acad: false, ques: true, exam: false, eval: false, stud: false },
      { module: "Test Series & Test Builder", super: true, admin: true, acad: false, ques: false, exam: true, eval: false, stud: false },
      { module: "Exam Windows & Proctoring", super: true, admin: true, acad: false, ques: false, exam: true, eval: false, stud: false },
      { module: "Attempt Auto-Submission", super: true, admin: true, acad: false, ques: false, exam: true, eval: false, stud: false },
      { module: "Scorecards & Leaderboard", super: true, admin: true, acad: true, ques: false, exam: true, eval: true, stud: false },
      { module: "System Settings & Audits", super: true, admin: true, acad: false, ques: false, exam: false, eval: false, stud: false },
      { module: "Own Tests & Performance", super: true, admin: true, acad: true, ques: true, exam: true, eval: true, stud: true },
    ],
    []
  );

  const totalMatrixPages = Math.max(1, Math.ceil(permissionsMatrix.length / matrixPageSize));
  const currentMatrixPage = Math.min(matrixPage, totalMatrixPages);
  const paginatedMatrix = useMemo(() => {
    const start = (currentMatrixPage - 1) * matrixPageSize;
    return permissionsMatrix.slice(start, start + matrixPageSize);
  }, [permissionsMatrix, currentMatrixPage, matrixPageSize]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/roles", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRoles(data || []);
      }
    } catch {
      onError("Failed to load roles and permissions matrix");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onError]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700">
              <ShieldCheck className="size-4" /> System Governance & Access Control
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Roles & Permissions Matrix
            </h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Role-Based Access Control (RBAC) enforced strictly at the database and API gateway level.
            </p>
          </div>

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
        </div>
      </section>

      {/* Role Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold text-indigo-700 tracking-wider">
                  {role.name}
                </span>
                <span className="flex items-center gap-1 text-3xs font-semibold text-slate-500">
                  <Users className="size-3" />
                  <span>{role.usersCount} users</span>
                </span>
              </div>

              <h3 className="mt-3 text-base font-bold text-slate-900">
                {role.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {role.description}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Scope Grants
              </p>
              <div className="space-y-1.5 text-xs">
                {role.permissions.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-slate-800">{p.module}</span>
                    <div className="flex items-center gap-2 text-3xs font-semibold">
                      <span className={p.canRead ? "text-emerald-700" : "text-slate-300"}>Read</span>
                      <span className={p.canWrite ? "text-blue-700" : "text-slate-300"}>Write</span>
                      <span className={p.canDelete ? "text-rose-700" : "text-slate-300"}>Delete</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <h3 className="text-base font-bold text-slate-900">
            Enterprise RBAC Permissions Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Visual breakdown of functional capabilities granted to each administrative tier
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Module</th>
                <th className="px-5 py-3">Superadmin</th>
                <th className="px-5 py-3">Admin</th>
                <th className="px-5 py-3">Academic Manager</th>
                <th className="px-5 py-3">Question Manager</th>
                <th className="px-5 py-3">Exam Manager</th>
                <th className="px-5 py-3">Evaluator</th>
                <th className="px-5 py-3 text-right">Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{row.module}</td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.super} /></td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.admin} /></td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.acad} /></td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.ques} /></td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.exam} /></td>
                  <td className="px-5 py-3.5"><CheckBadge value={row.eval} /></td>
                  <td className="px-5 py-3.5 text-right"><CheckBadge value={row.stud} alignRight /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Permissions Matrix Pagination */}
        {permissionsMatrix.length > 0 && (
          <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
            <TablePagination
              page={currentMatrixPage}
              pageSize={matrixPageSize}
              totalItems={permissionsMatrix.length}
              onPageChange={setMatrixPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function CheckBadge({ value, alignRight = false }: { value: boolean; alignRight?: boolean }) {
  if (value) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 ${alignRight ? "justify-end" : ""}`}>
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span>Granted</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-slate-300 ${alignRight ? "justify-end" : ""}`}>
      <span>—</span>
    </span>
  );
}
