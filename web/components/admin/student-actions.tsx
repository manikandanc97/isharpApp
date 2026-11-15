import { Button } from "@/components/ui/button";
import { RosterActions } from "./internal-student-manager";
import type { InternalStudent, User } from "./admin-types";

export interface StudentActionsProps {
  user: User;
  rosterStudent?: InternalStudent;
  isInternalStudent: boolean;
  manageable: boolean;
  deletingRosterId: string | null;
  onViewDetails: (user: User) => void;
  onEditRoster: (student: InternalStudent) => void;
  onDeleteRoster: (student: InternalStudent) => void;
  onConvert: (user: User) => void;
  onManageAccess: (user: User) => void;
  onToggle: (user: User) => void;
}

export function StudentActions({
  user,
  rosterStudent,
  isInternalStudent,
  manageable,
  deletingRosterId,
  onViewDetails,
  onEditRoster,
  onDeleteRoster,
  onConvert,
  onManageAccess,
  onToggle,
}: StudentActionsProps) {
  return (
    <div className="flex items-center justify-end">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewDetails(user)}
        className="mr-2 cursor-pointer"
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
          className="mr-2 bg-brand-blue text-white hover:bg-blue-700 cursor-pointer"
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
          className="mr-2 hover:bg-rose-50 hover:text-brand-red hover:border-rose-200 cursor-pointer"
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
          className={`cursor-pointer ${
            user.isActive
              ? "hover:bg-red-50 hover:text-red-700"
              : "hover:bg-emerald-50 hover:text-emerald-700"
          }`}
        >
          {user.isActive ? "Suspend" : "Activate"}
        </Button>
      )}
    </div>
  );
}
