"use client";

import { Clock, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatLeadDateTime,
  type DemoLeadRecord,
  type FollowUpStatus,
  type LeadAttemptRecord,
} from "./demo-leads.types";

interface EditLeadDialogProps {
  lead: DemoLeadRecord | null;
  phone: string;
  onPhoneChange: (val: string) => void;
  status: FollowUpStatus;
  onStatusChange: (val: FollowUpStatus) => void;
  consent: boolean;
  onConsentChange: (val: boolean) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditDemoLeadDialog({
  lead,
  phone,
  onPhoneChange,
  status,
  onStatusChange,
  consent,
  onConsentChange,
  notes,
  onNotesChange,
  saving,
  onClose,
  onSubmit,
}: EditLeadDialogProps) {
  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit &amp; Update Demo Lead</DialogTitle>
          <DialogDescription className="text-xs">
            Update mobile number, consent, follow-up status &amp; notes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Mobile Number
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+91XXXXXXXXXX"
              className="mt-1.5 h-9 w-full rounded-xl border border-slate-200 px-3 font-mono text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Follow-up Status
              </label>
              <Select
                value={status}
                onValueChange={(value) =>
                  value && onStatusChange(value as FollowUpStatus)
                }
              >
                <SelectTrigger className="mt-1.5 h-9 w-full text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW" label="New">
                    New
                  </SelectItem>
                  <SelectItem value="CONTACTED" label="Contacted">
                    Contacted
                  </SelectItem>
                  <SelectItem value="INTERESTED" label="Interested">
                    Interested
                  </SelectItem>
                  <SelectItem value="JOINED" label="Joined">
                    Joined
                  </SelectItem>
                  <SelectItem value="NOT_INTERESTED" label="Not Interested">
                    Not Interested
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Marketing Consent
              </label>
              <Select
                value={consent ? "GRANTED" : "NOT_GRANTED"}
                onValueChange={(value) =>
                  onConsentChange(value === "GRANTED")
                }
              >
                <SelectTrigger className="mt-1.5 h-9 w-full text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GRANTED" label="Yes (Granted)">
                    Yes (Granted)
                  </SelectItem>
                  <SelectItem value="NOT_GRANTED" label="No">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Administrator Notes
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Add admission follow-up notes..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 outline-none focus:border-indigo-500"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-full text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="gap-1.5 rounded-full bg-brand-red text-xs font-bold text-white hover:bg-brand-red-hover"
            >
              {saving && <LoaderCircle className="size-3.5 animate-spin" />}
              Update Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteLeadDialogProps {
  lead: DemoLeadRecord | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDemoLeadDialog({
  lead,
  busy,
  onClose,
  onConfirm,
}: DeleteLeadDialogProps) {
  return (
    <Dialog
      open={Boolean(lead)}
      onOpenChange={(open) => !open && !busy && onClose()}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Demo Lead?</DialogTitle>
          <DialogDescription className="text-xs">
            This will permanently remove{" "}
            <span className="font-mono font-semibold text-slate-900">
              {lead?.normalizedPhone}
            </span>{" "}
            from the Demo Leads directory.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={busy}
            className="rounded-full text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="gap-1.5 rounded-full bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
          >
            {busy && <LoaderCircle className="size-3.5 animate-spin" />}
            Delete Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AttemptHistoryDialogProps {
  lead: DemoLeadRecord | null;
  attempts: LeadAttemptRecord[];
  loading: boolean;
  onClose: () => void;
}

export function DemoLeadHistoryDialog({
  lead,
  attempts,
  loading,
  onClose,
}: AttemptHistoryDialogProps) {
  return (
    <Dialog open={Boolean(lead)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Demo Test Attempt History</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {lead?.normalizedPhone}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <LoaderCircle className="size-4 animate-spin" />
            <span>Loading attempts...</span>
          </div>
        ) : attempts.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No demo test attempts recorded for this lead yet.
          </p>
        ) : (
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {att.subjectMode === "ALL"
                      ? "All Subjects"
                      : att.subjectMode}{" "}
                    · {att.questionCount} Qs
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-2xs text-slate-500">
                    <Clock className="size-3" />
                    {formatLeadDateTime(att.startedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {att.totalScore !== null
                      ? `${att.totalScore} / ${att.maxMarks}`
                      : att.status}
                  </p>
                  {att.accuracyPercentage !== null && (
                    <p className="text-2xs text-slate-500">
                      Accuracy: {att.accuracyPercentage}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
