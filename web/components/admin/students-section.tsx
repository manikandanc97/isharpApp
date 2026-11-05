"use client";

import { useMemo, useState } from "react";
import { api } from "./admin-api";
import {
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
    const accountEntries: StudentDirectoryEntry[] = users
      .filter((user) => {
        const rosterStudent = rosterForUser(user);
        return (
          (studentType === "ALL" ||
            user.institutionMembership?.studentCategory === studentType) &&
          `${user.displayName} ${user.email ?? ""} ${user.institutionMembership?.studentId ?? ""} ${rosterStudent?.studentId ?? ""} ${rosterStudent?.fullName ?? ""}`
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
  }, [internalStudents, query, studentType, users]);

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
        onToggle={onToggle}
      />
      <TablePagination
        page={currentPage}
        pageSize={pageSize}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </LightLuxuryPanel>
  );
}

// Legacy verification UI retained for audit-history compatibility.
export { Verification } from "./verification-section";

