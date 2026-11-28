"use client";

import { useState } from "react";
import { BookOpen, Layers3, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CurriculumSubject, SubjectFormData } from "./curriculum-types";

interface SubjectDialogProps {
  open: boolean;
  onClose: () => void;
  subject?: CurriculumSubject | null;
  onSave: (data: SubjectFormData) => void;
}

export function SubjectDialog({
  open,
  onClose,
  subject,
  onSave,
}: SubjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      {open && (
        <SubjectDialogForm
          key={subject?.id ?? "new"}
          onClose={onClose}
          subject={subject}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}

function SubjectDialogForm({
  onClose,
  subject,
  onSave,
}: Omit<SubjectDialogProps, "open">) {
  const isEditing = Boolean(subject);
  const [name, setName] = useState(subject?.name ?? "");
  const [code, setCode] = useState(subject?.code ?? "");
  const [description, setDescription] = useState(subject?.description || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Subject name is required");
      return;
    }
    if (!code.trim()) {
      setError("Subject code is required (e.g., BIOLOGY, MATH)");
      return;
    }

    onSave({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || undefined,
      isActive: true,
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              {isEditing ? <BookOpen className="size-4" /> : <Layers3 className="size-4" />}
            </div>
            <div>
              <DialogTitle className="text-slate-900">
                {isEditing ? "Edit Subject" : "Add New Subject"}
              </DialogTitle>
              <DialogDescription>
                Configure subject details in the curriculum catalog.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-800">
              {error}
            </div>
          )}

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subject Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Physics, Chemistry, Biology, Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Subject Code *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BOTANY, ZOOLOGY, MATH"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold uppercase tracking-wider text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="text-3xs text-slate-400">
              Unique uppercase identifier used in question bank mapping and tags.
            </p>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Curriculum coverage details, cohort suitability..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="rounded-full bg-brand-navy hover:bg-brand-navy/90 text-white gap-1.5 shadow-xs"
            >
              {isEditing ? <Save className="size-3.5" /> : <Plus className="size-3.5" />}
              <span>{isEditing ? "Save Changes" : "Create Subject"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
