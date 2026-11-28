"use client";

import { useState } from "react";
import { BookOpen, Plus, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ChapterFormData, CurriculumChapter } from "./curriculum-types";

interface ChapterDialogProps {
  open: boolean;
  onClose: () => void;
  chapter?: CurriculumChapter | null;
  subjectName: string;
  defaultPosition?: number;
  onSave: (data: ChapterFormData) => void;
}

export function ChapterDialog({
  open,
  onClose,
  chapter,
  subjectName,
  defaultPosition = 1,
  onSave,
}: ChapterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      {open && (
        <ChapterDialogForm
          key={chapter?.id ?? `new-${defaultPosition}`}
          onClose={onClose}
          chapter={chapter}
          subjectName={subjectName}
          defaultPosition={defaultPosition}
          onSave={onSave}
        />
      )}
    </Dialog>
  );
}

function ChapterDialogForm({
  onClose,
  chapter,
  subjectName,
  defaultPosition = 1,
  onSave,
}: Omit<ChapterDialogProps, "open">) {
  const isEditing = Boolean(chapter);
  const [title, setTitle] = useState(chapter?.title ?? "");
  const [position, setPosition] = useState(chapter?.position ?? defaultPosition);
  const [description, setDescription] = useState(chapter?.description || "");
  const [isActive, setIsActive] = useState(chapter?.isActive ?? true);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Chapter title is required");
      return;
    }

    onSave({
      title: title.trim(),
      position: Number(position) || 1,
      description: description.trim() || undefined,
      isActive,
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl bg-blue-50 text-brand-blue ring-1 ring-blue-100">
              <BookOpen className="size-4.5" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? "Edit Chapter" : "Add Chapter"}
              </DialogTitle>
              <DialogDescription>
                {subjectName} curriculum indexing & sequence management.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                # Pos *
              </label>
              <input
                type="number"
                min={1}
                required
                value={position}
                onChange={(e) => setPosition(parseInt(e.target.value, 10) || 1)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-center"
              />
            </div>

            <div className="col-span-3 grid gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Chapter Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Thermodynamics, Optics, Equilibrium"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Curriculum Notes / Scope
            </label>
            <textarea
              rows={3}
              placeholder="Syllabus coverage boundaries, NCERT reference..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-800">Chapter Status</p>
              <p className="text-3xs text-slate-500">
                Active chapters appear in question authoring and mock test papers.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block size-4.5 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
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
              <span>{isEditing ? "Save Chapter" : "Add Chapter"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
  );
}
