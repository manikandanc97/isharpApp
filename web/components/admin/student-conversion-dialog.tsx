import { LoaderCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-brand-blue">
              <UserCheck className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                Convert external student?
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {user?.displayName} will receive a new internal Student ID. Their
                UUID, login, records, and current external ID history will be
                preserved.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="conversion-reason" className="text-xs font-semibold text-slate-700">
            Conversion reason *
          </Label>
          <Textarea
            id="conversion-reason"
            required
            minLength={3}
            maxLength={500}
            rows={4}
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className="text-xs resize-none"
            placeholder="Why is this student joining the institute?"
          />
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={converting}
            onClick={onClose}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={converting || reason.trim().length < 3}
            onClick={onConfirm}
            className="bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover"
          >
            {converting && <LoaderCircle className="mr-1.5 size-4 animate-spin" />}
            Confirm conversion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
