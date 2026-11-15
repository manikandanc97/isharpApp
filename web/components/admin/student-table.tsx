import { TablePagination } from "./admin-helpers";
import { StudentDirectoryTable } from "./student-directory-table";
import type { InternalStudent, StudentDirectoryEntry, User } from "./admin-types";

export interface StudentTableProps {
  entries: StudentDirectoryEntry[];
  totalFiltered: number;
  deletingRosterId: string | null;
  currentProfileId?: string | null;
  canManagePrivileged: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEditRoster: (student: InternalStudent) => void;
  onDeleteRoster: (student: InternalStudent) => void;
  onManageAccess: (user: User) => void;
  onViewDetails: (user: User) => void;
  onConvert: (user: User) => void;
  onToggle: (user: User) => void;
}

export function StudentTable({
  entries,
  totalFiltered,
  deletingRosterId,
  currentProfileId,
  canManagePrivileged,
  page,
  pageSize,
  onPageChange,
  onEditRoster,
  onDeleteRoster,
  onManageAccess,
  onViewDetails,
  onConvert,
  onToggle,
}: StudentTableProps) {
  return (
    <div className="space-y-4">
      <StudentDirectoryTable
        entries={entries}
        totalFiltered={totalFiltered}
        deletingRosterId={deletingRosterId}
        currentProfileId={currentProfileId}
        canManagePrivileged={canManagePrivileged}
        onEditRoster={onEditRoster}
        onDeleteRoster={onDeleteRoster}
        onManageAccess={onManageAccess}
        onViewDetails={onViewDetails}
        onConvert={onConvert}
        onToggle={onToggle}
      />
      <TablePagination
        page={page}
        pageSize={pageSize}
        totalItems={totalFiltered}
        onPageChange={onPageChange}
      />
    </div>
  );
}
