"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ExamExitConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onExit: () => void;
  titleIcon?: ReactNode;
  confirmIcon?: ReactNode;
  contentClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  footerClassName?: string;
  cancelClassName?: string;
  confirmClassName?: string;
}

/**
 * Shared exit confirmation dialog for live examinations and demo tests.
 * Preserves caller-specific copy, icons, and button layouts without duplicating Dialog boilerplate.
 */
export function ExamExitConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onExit,
  titleIcon,
  confirmIcon,
  contentClassName = "max-w-md p-6",
  headerClassName = "space-y-1.5",
  titleClassName = "text-base font-bold text-slate-900",
  descriptionClassName = "text-xs text-slate-600 leading-relaxed",
  footerClassName = "mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end",
  cancelClassName = "rounded-full text-xs font-semibold",
  confirmClassName = "rounded-full text-xs font-bold",
}: ExamExitConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={contentClassName}>
        <DialogHeader className={headerClassName}>
          {titleIcon ? (
            <div className="flex items-center gap-2">
              {titleIcon}
              <DialogTitle className={titleClassName}>{title}</DialogTitle>
            </div>
          ) : (
            <DialogTitle className={titleClassName}>{title}</DialogTitle>
          )}
          <DialogDescription className={descriptionClassName}>
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className={footerClassName}>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={cancelClassName}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="destructive"
            onClick={onExit}
            className={confirmClassName}
          >
            {confirmIcon}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
