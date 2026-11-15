import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "./admin-helpers";
import type { User } from "./admin-types";

export interface StudentDetailsDialogProps {
  user: User | null;
  onClose: () => void;
}

export function StudentDetailsDialog({ user, onClose }: StudentDetailsDialogProps) {
  return (
    <Dialog open={Boolean(user)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl bg-white p-6">
        <DialogTitle>Student identity</DialogTitle>
        <DialogDescription>
          Current and previous official student IDs for {user?.displayName}.
        </DialogDescription>
        <div className="mt-4 rounded-xl border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current Student ID
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {user?.institutionMembership?.studentId ?? "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {user?.institutionMembership?.studentCategory ?? "No student type"}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-slate-900">ID history</p>
          {user?.institutionMembership?.studentIdHistory &&
          user.institutionMembership.studentIdHistory.length > 0 ? (
            user.institutionMembership.studentIdHistory.map((item) => (
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
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No previous ID history recorded.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
