import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-brand-blue">
              <UserCheck className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Student Identity
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Current and previous official student IDs for {user?.displayName}.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Current Student ID
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 font-mono">
              {user?.institutionMembership?.studentId ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {user?.institutionMembership?.studentCategory ?? "No student type"}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              ID History
            </p>
            {user?.institutionMembership?.studentIdHistory &&
            user.institutionMembership.studentIdHistory.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {user.institutionMembership.studentIdHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 font-mono">
                        {item.studentCode}
                      </p>
                      <p className="text-slate-500 mt-0.5">
                        {item.studentType} · {item.changeReason}
                      </p>
                    </div>
                    <div className="text-right text-slate-400">
                      <p className="font-medium text-slate-600">
                        {item.isCurrent ? "Current" : "Previous"}
                      </p>
                      <p className="mt-0.5">{formatDate(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No previous ID history recorded.</p>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
