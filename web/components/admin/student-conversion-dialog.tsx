import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "./admin-types";

export interface StudentConversionDialogProps {
  user: User | null;
  reason: string;
  onReasonChange: (reason: string) => void;
  converting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function StudentConversionDialog({
  user,
  reason,
  onReasonChange,
  converting,
  onConfirm,
  onClose,
}: StudentConversionDialogProps) {
  return (
    <Dialog
      open={Boolean(user)}
      onOpenChange={(open) => !open && !converting && onClose()}
    >
      <DialogContent className="max-w-lg rounded-2xl bg-white p-6">
        <DialogTitle>Convert external student?</DialogTitle>
        <DialogDescription>
          {user?.displayName} will receive a new internal Student ID. Their
          UUID, login, records, and current external ID history will be
          preserved.
        </DialogDescription>
        <label className="mt-4 grid gap-2 text-sm font-semibold text-slate-700">
          Conversion reason
          <textarea
            required
            minLength={3}
            maxLength={500}
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="resize-none rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
            placeholder="Why is this student joining the institute?"
          />
        </label>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" disabled={converting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={converting || reason.trim().length < 3}
            onClick={onConfirm}
            className="bg-brand-blue text-white hover:bg-blue-700 cursor-pointer"
          >
            {converting && <LoaderCircle className="mr-2 size-4 animate-spin" />}
            Confirm conversion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
