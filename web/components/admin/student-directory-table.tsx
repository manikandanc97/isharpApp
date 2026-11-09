"use client";

import { Button } from "@/components/ui/button";
import { formatDate, initials, LightEmpty } from "./admin-helpers";
import { RosterActions } from "./internal-student-manager";
import type {
  InternalStudent,
  StudentDirectoryEntry,
  User,
} from "./admin-types";

export interface StudentDirectoryTableProps {
  entries: StudentDirectoryEntry[];
  totalFiltered: number;
  deletingRosterId: string | null;
  currentProfileId?: string | null;
  canManagePrivileged: boolean;
  onEditRoster: (student: InternalStudent) => void;
  onDeleteRoster: (student: InternalStudent) => void;
  onManageAccess: (user: User) => void;
  onViewDetails: (user: User) => void;
  onConvert: (user: User) => void;
  onToggle: (user: User) => void;
}

export function StudentDirectoryTable({
  entries,
  totalFiltered,
  deletingRosterId,
  currentProfileId,
  canManagePrivileged,
  onEditRoster,
  onDeleteRoster,
  onManageAccess,
  onViewDetails,
  onConvert,
  onToggle,
}: StudentDirectoryTableProps) {
  return (
    <div
      className="overflow-x-auto rounded-xl border border-slate-200"
      tabIndex={0}
      role="region"
      aria-label="Student directory table"
    >
      <table className="w-full min-w-2xl text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-3 px-4 font-semibold">User</th>
            <th className="py-3 px-4 font-semibold">Student ID</th>
            <th className="py-3 px-4 font-semibold">Student Type</th>
            <th className="py-3 px-4 text-right font-semibold">Control</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {entries.map((entry) => {
            if (entry.kind === "roster") {
              const student = entry.student;
              return (
                <tr key={entry.id} className="transition hover:bg-blue-50/30">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-brand-blue">
                        {initials(student.fullName || student.email || "IS")}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {student.fullName || "Internal student"}
                        </p>
                        <p className="max-w-56 truncate text-xs text-slate-400">
                          {student.email || "No login email"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                    {student.studentId}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-brand-blue">
                      INTERNAL · FREE
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <RosterActions
                      student={student}
                      deleting={deletingRosterId === student.id}
                      onEdit={onEditRoster}
                      onDelete={onDeleteRoster}
                    />
                  </td>
                </tr>
              );
            }
            const user = entry.user;
            const rosterStudent = entry.rosterStudent;
            const isInternalStudent =
              Boolean(rosterStudent) ||
              user.institutionMembership?.studentCategory === "INTERNAL";
            const privileged = user.roles.some(
              (role) => role === "ADMIN" || role === "SUPERADMIN",
            );
            const manageable =
              user.id !== currentProfileId &&
              (!privileged || canManagePrivileged);
            return (
              <tr key={entry.id} className="transition hover:bg-slate-50/60">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50 text-xs font-semibold text-brand-red">
                      {initials(user.displayName)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {user.email || `Joined ${formatDate(user.createdAt)}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-slate-600">
                  {rosterStudent?.studentId ??
                    user.institutionMembership?.studentId ??
                    "—"}
                </td>
                <td className="py-3.5 px-4">
                  {user.institutionMembership ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.institutionMembership.studentCategory ===
                        "INTERNAL"
                          ? "bg-blue-50 text-brand-blue border border-blue-200/80"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {user.institutionMembership.studentCategory === "INTERNAL"
                        ? "INTERNAL · FREE"
                        : "EXTERNAL · PAID"}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(user)}
                    className="mr-2"
                  >
                    Details
                  </Button>
                  {rosterStudent && (
                    <RosterActions
                      student={rosterStudent}
                      deleting={deletingRosterId === rosterStudent.id}
                      onEdit={onEditRoster}
                      onDelete={onDeleteRoster}
                    />
                  )}
                  {!isInternalStudent && user.institutionMembership && (
                    <Button
                      size="sm"
                      disabled={!manageable}
                      onClick={() => onConvert(user)}
                      className="mr-2 bg-brand-blue text-white hover:bg-blue-700"
                    >
                      Convert
                    </Button>
                  )}
                  {!isInternalStudent && user.institutionMembership && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!manageable}
                      onClick={() => onManageAccess(user)}
                      className="mr-2 hover:bg-rose-50 hover:text-brand-red hover:border-rose-200"
                    >
                      Access
                    </Button>
                  )}
                  {!isInternalStudent && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!manageable}
                      onClick={() => onToggle(user)}
                      className={
                        user.isActive
                          ? "hover:bg-red-50 hover:text-red-700"
                          : "hover:bg-emerald-50 hover:text-emerald-700"
                      }
                    >
                      {user.isActive ? "Suspend" : "Activate"}
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!totalFiltered && <LightEmpty text="No matching students found." />}
    </div>
  );
}
