"use client";

import { useState } from "react";
import { api } from "./admin-api";
import { LightLuxuryPanel } from "./admin-helpers";
import { InternalStudentManager } from "./internal-student-manager";
import { StudentConversionDialog } from "./student-conversion-dialog";
import { StudentDetailsDialog } from "./student-details-dialog";
import { StudentSearchBar } from "./student-search-bar";
import { StudentTable } from "./student-table";
import { useStudentSearch } from "./use-student-search";
import type {
  InternalStudent,
  User,
} from "./admin-types";

export { StudentActions } from "./student-actions";
export { StudentConversionDialog } from "./student-conversion-dialog";
export { StudentDetailsDialog } from "./student-details-dialog";
export { StudentSearchBar } from "./student-search-bar";
export { StudentTable } from "./student-table";
export { useStudentSearch } from "./use-student-search";

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
  const [deletingRosterId, setDeletingRosterId] = useState<string | null>(null);
  const [editingRosterStudent, setEditingRosterStudent] =
    useState<InternalStudent | null>(null);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [conversionUser, setConversionUser] = useState<User | null>(null);
  const [conversionReason, setConversionReason] = useState("");
  const [converting, setConverting] = useState(false);

  const {
    query,
    setQuery,
    studentType,
    setStudentType,
    page,
    setPage,
    pageSize,
    filtered,
    paginatedEntries,
    resetSearch,
  } = useStudentSearch({
    users,
    internalStudents,
    onError,
  });

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
            resetSearch();
            setStudentType("INTERNAL");
          }}
          onNotice={onNotice}
          onError={onError}
        />
      }
    >
      <StudentSearchBar
        query={query}
        onQueryChange={setQuery}
        showingCount={paginatedEntries.length}
        totalFilteredCount={filtered.length}
        studentType={studentType}
        onStudentTypeChange={setStudentType}
      />

      <StudentTable
        entries={paginatedEntries}
        totalFiltered={filtered.length}
        deletingRosterId={deletingRosterId}
        currentProfileId={currentProfileId}
        canManagePrivileged={canManagePrivileged}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
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

      <StudentDetailsDialog
        user={detailsUser}
        onClose={() => setDetailsUser(null)}
      />

      <StudentConversionDialog
        user={conversionUser}
        reason={conversionReason}
        onReasonChange={setConversionReason}
        converting={converting}
        onConfirm={() => void convertStudent()}
        onClose={() => setConversionUser(null)}
      />
    </LightLuxuryPanel>
  );
}

// Legacy verification UI retained for audit-history compatibility.
export { Verification } from "./verification-section";
