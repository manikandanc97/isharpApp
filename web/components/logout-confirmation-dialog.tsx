"use client";

import { LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface LogoutConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function LogoutConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "Confirm Sign Out",
  description = "Are you sure you want to log out? You will need to sign in again to access your learning portal, tests, and academic progress.",
  confirmLabel = "Yes, Log Out",
  cancelLabel = "Cancel",
}: LogoutConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200">
        <DialogHeader className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-brand-red border border-rose-100 shadow-xs">
            <LogOut className="size-5 text-brand-red" strokeWidth={2.2} />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm leading-relaxed text-slate-500 font-normal">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-full px-5 py-2 text-xs sm:text-sm font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => void onConfirm()}
            className="w-full sm:w-auto rounded-full bg-brand-red hover:bg-brand-red-hover px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-primary hover:shadow-primary-hover active:scale-95 transition-all"
          >
            {isLoading ? (
              <>
                <LoaderCircle className="size-4 animate-spin mr-1.5" />
                <span>Signing out…</span>
              </>
            ) : (
              <>
                <LogOut className="size-4 mr-1.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

