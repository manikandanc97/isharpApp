"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "./admin-api";
import {
  formatDate,
  LightLuxuryPanel,
  LightSearchBox,
  TablePagination,
} from "./admin-helpers";
import { InternalStudentManager } from "./internal-student-manager";
import { StudentDirectoryTable } from "./student-directory-table";
import type {
  InternalStudent,
  StudentDirectoryEntry,
  User,
} from "./admin-types";

export interface StudentsSectionProps {
  users: User[];
  internalStudents: InternalStudent[];
  currentProfileId?: string | null;
  canManagePrivileged: boolean;
  onToggle: (user: User) => void;
  onManageAccess: (user: User) => void;
  onRosterCreated: (student: InternalStudent) => void;
  onRosterDeleted: (studentId: string) => void;
  onConverted: () => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}

export function StudentsSection({
  users,
  internalStudents,
  currentProfileId,
  canManagePrivileged,
  onToggle,
  onManageAccess,
  onRosterCreated,
  onRosterDeleted,
  onConverted,
  onNotice,
  onError,
}: StudentsSectionProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [deletingRosterId, setDeletingRosterId] = useState<string | null>(null);
  const [editingRosterStudent, setEditingRosterStudent] =
    useState<InternalStudent | null>(null);
  const [studentType, setStudentType] = useState<
    "ALL" | "INTERNAL" | "EXTERNAL"
  >("ALL");
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [conversionUser, setConversionUser] = useState<User | null>(null);
  const [conversionReason, setConversionReason] = useState("");
  const [converting, setConverting] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<User[] | null>(null);

  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void api<User[]>(`users?query=${encodeURIComponent(normalized)}`)
        .then((result) => {
          if (!cancelled) setMatchedUsers(result);
        })
        .catch((error: unknown) => {
          if (!cancelled)
            onError(
              error instanceof Error ? error.message : "Student search failed",
            );
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onError, query]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rosterById = new Map(
      internalStudents.map((student) => [student.id, student]),
    );
    const rosterByEmail = new Map(
      internalStudents
        .filter((student) => student.email)
        .map((student) => [student.email!.trim().toLowerCase(), student]),
    );
    const rosterByStudentId = new Map(
      internalStudents.map((student) => [student.studentId, student]),
    );
    const rosterForUser = (user: User) => {
      const membership = user.institutionMembership;
      if (membership?.trustedRecordId) {
        const linked = rosterById.get(membership.trustedRecordId);
        if (linked) return linked;
      }
      if (user.email) {
        const emailMatch = rosterByEmail.get(user.email.trim().toLowerCase());
        if (
          emailMatch &&
          (!emailMatch.authUserId || emailMatch.authUserId === user.authUserId)
        )
          return emailMatch;
      }
      const studentIdMatch = membership
        ? rosterByStudentId.get(membership.studentId)
        : undefined;
      return studentIdMatch &&
        (!studentIdMatch.authUserId ||
          studentIdMatch.authUserId === user.authUserId)
        ? studentIdMatch
        : undefined;
    };
    const accountEntries: StudentDirectoryEntry[] = (
      normalizedQuery ? (matchedUsers ?? users) : users
    )
      .filter((user) => {
        const rosterStudent = rosterForUser(user);
        return (
          (studentType === "ALL" ||
            user.institutionMembership?.studentCategory === studentType) &&
          `${user.displayName} ${user.email ?? ""} ${user.phone ?? ""} ${user.institutionMembership?.studentId ?? ""} ${user.institutionMembership?.studentIdHistory?.map((item) => item.studentCode).join(" ") ?? ""} ${rosterStudent?.studentId ?? ""} ${rosterStudent?.fullName ?? ""}`
            .toLowerCase()
            .includes(normalizedQuery)
        );
      })
      .map((user) => ({
        kind: "account",
        id: `account-${user.id}`,
        createdAt: user.createdAt,
        user,
        rosterStudent: rosterForUser(user),
      }));
    const linkedRosterIds = new Set(
      accountEntries
        .map((entry) =>
          entry.kind === "account" ? entry.rosterStudent?.id : undefined,
        )
        .filter((id): id is string => Boolean(id)),
    );
    const rosterEntries: StudentDirectoryEntry[] = internalStudents
      .filter(
        (student) =>
          !linkedRosterIds.has(student.id) &&
          studentType !== "EXTERNAL" &&
          `${student.fullName ?? ""} ${student.email ?? ""} ${student.studentId}`
            .toLowerCase()
            .includes(normalizedQuery),
      )
      .map((student) => ({
        kind: "roster",
        id: `roster-${student.id}`,
        createdAt: student.createdAt,
        student,
      }));

    return [...accountEntries, ...rosterEntries].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );
  }, [internalStudents, matchedUsers, query, studentType, users]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEntries = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  async function deleteRosterStudent(student: InternalStudent) {
    const label = student.fullName || student.email || student.studentId;
    if (
      !window.confirm(
        `Delete ${label} from the internal student roster? This permanently removes the database record.`,
      )
    )
      return;

    setDeletingRosterId(student.id);
    try {
      await api<{ id: string; deleted: true }>(
        `internal-students/${student.id}`,
        {
          method: "DELETE",
        },
      );
      onRosterDeleted(student.id);
      onNotice(`${label} was removed from the internal student roster.`);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Student could not be deleted",
      );
    } finally {
      setDeletingRosterId(null);
    }
  }

  async function convertStudent() {
    const membership = conversionUser?.institutionMembership;
    if (!membership || conversionReason.trim().length < 3) return;
    setConverting(true);
    try {
      await api(`memberships/${membership.id}/convert-to-internal`, {
        method: "POST",
        body: JSON.stringify({ reason: conversionReason.trim() }),
      });
      onNotice(
        `${conversionUser.displayName} was converted to an internal student.`,
      );
      setConversionUser(null);
      setConversionReason("");
      onConverted();
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Student conversion failed",
      );
    } finally {
      setConverting(false);
    }
  }

  return (
    <LightLuxuryPanel
      title="Student directory"
      description="Manage the internal roster and student accounts in one place."
      headerAction={
        <InternalStudentManager
          key={editingRosterStudent?.id ?? "new-student"}
          editStudent={editingRosterStudent}
          onEditClosed={() => setEditingRosterStudent(null)}
          onCreated={(student) => {
            onRosterCreated(student);
            setQuery("");
            setStudentType("INTERNAL");
            setPage(1);
          }}
          onNotice={onNotice}
          onError={onError}
        />
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LightSearchBox
          value={query}
          onChange={(value) => {
            setQuery(value);
            setMatchedUsers(null);
            setPage(1);
          }}
          placeholder="Search name or student ID…"
        />
        <span className="text-xs font-semibold text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {paginatedEntries.length}
          </span>{" "}
          of {filtered.length} students
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["ALL", "INTERNAL", "EXTERNAL"] as const).map((type) => (
          <button
            key={type}
            onClick={() => {
              setStudentType(type);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${studentType === type ? "border-brand-blue bg-brand-blue text-white shadow-xs" : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"}`}
          >
            {type === "ALL"
              ? "All students"
              : type === "INTERNAL"
                ? "Internal"
                : "External"}
          </button>
        ))}
      </div>

      <StudentDirectoryTable
        entries={paginatedEntries}
        totalFiltered={filtered.length}
        deletingRosterId={deletingRosterId}
        currentProfileId={currentProfileId}
        canManagePrivileged={canManagePrivileged}
        onEditRoster={setEditingRosterStudent}
        onDeleteRoster={(selectedStudent) =>
          void deleteRosterStudent(selectedStudent)
        }
        onManageAccess={onManageAccess}
        onViewDetails={setDetailsUser}
        onConvert={(user) => {
          setConversionReason("");
          setConversionUser(user);
        }}
        onToggle={onToggle}
      />
      <TablePagination
        page={currentPage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
      />

      <Dialog
        open={Boolean(detailsUser)}
        onOpenChange={(open) => !open && setDetailsUser(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6">
          <DialogTitle>Student identity</DialogTitle>
          <DialogDescription>
            Current and previous official student IDs for{" "}
            {detailsUser?.displayName}.
          </DialogDescription>
          <div className="mt-4 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Student ID
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {detailsUser?.institutionMembership?.studentId ?? "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {detailsUser?.institutionMembership?.studentCategory ??
                "No student type"}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-900">ID history</p>
            {detailsUser?.institutionMembership?.studentIdHistory?.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.studentCode}
                    </p>
                    <p className="text-slate-500">
                      {item.studentType} · {item.changeReason}
                    </p>
                  </div>
                  <div className="text-right text-slate-400">
                    <p>{item.isCurrent ? "Current" : "Previous"}</p>
                    <p>{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(conversionUser)}
        onOpenChange={(open) => !open && !converting && setConversionUser(null)}
      >
        <DialogContent className="max-w-lg rounded-2xl bg-white p-6">
          <DialogTitle>Convert external student?</DialogTitle>
          <DialogDescription>
            {conversionUser?.displayName} will receive a new internal Student
            ID. Their UUID, login, records, and current external ID history will
            be preserved.
          </DialogDescription>
          <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
            Conversion reason
            <textarea
              required
              minLength={3}
              maxLength={500}
              rows={4}
              value={conversionReason}
              onChange={(event) => setConversionReason(event.target.value)}
              className="resize-none rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
              placeholder="Why is this student joining the institute?"
            />
          </label>
          <div className="mt-5 flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={converting}
              onClick={() => setConversionUser(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={converting || conversionReason.trim().length < 3}
              onClick={() => void convertStudent()}
              className="bg-brand-blue text-white hover:bg-blue-700"
            >
              {converting && (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              )}
              Confirm conversion
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </LightLuxuryPanel>
  );
}

// Legacy verification UI retained for audit-history compatibility.
export { Verification } from "./verification-section";
