"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Layers3,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "cn";
import type { CurriculumSubject, SubjectFormData } from "./curriculum-types";
import { SubjectDialog } from "./subject-dialog";
import { SubjectDeleteDialog } from "./subject-delete-dialog";

interface SubjectPanelProps {
  subjects: CurriculumSubject[];
  selectedSubjectId: string;
  onSelectSubject: (subjectId: string) => void;
  onAddSubject: (data: SubjectFormData) => void;
  onEditSubject: (subjectId: string, data: Partial<SubjectFormData>) => void;
  onReorder: (subjectId: string, direction: "up" | "down") => void;
  onDeleteSubject: (subjectId: string) => void;
  className?: string;
}

export function SubjectPanel({
  subjects,
  selectedSubjectId,
  onSelectSubject,
  onAddSubject,
  onEditSubject,
  onReorder,
  onDeleteSubject,
  className,
}: SubjectPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<CurriculumSubject | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<CurriculumSubject | null>(null);

  const handleDeleteClick = (subject: CurriculumSubject, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSubject(subject);
  };

  const handleEditClick = (subject: CurriculumSubject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubject(subject);
  };

  const handleReorderClick = (
    subjectId: string,
    direction: "up" | "down",
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onReorder(subjectId, direction);
  };

  return (
    <aside
      className={cn(
        "flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden max-h-[calc(100vh-var(--layout-app-header-height,4rem)-2.5rem)]",
        className
      )}
    >
      {/* Panel Header */}
      <div className="shrink-0 border-b border-slate-200 bg-[#fbfbfa] p-4 sm:px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100">
              <Layers3 className="size-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Subjects / Curriculum
              </h3>
              <p className="text-3xs text-slate-400">
                {subjects.length} mapped disciplines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAddDialogOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-navy/90 active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Subject List */}
      <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1 min-h-0">
        {subjects.map((subject, index) => {
          const isSelected = subject.id === selectedSubjectId;

          // Subject color indicator based on code
          const badgeTone =
            subject.code === "PHYSICS"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : subject.code === "CHEMISTRY"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : subject.code === "BIOLOGY"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-indigo-50 text-indigo-700 border-indigo-200";

          return (
            <div
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={`group relative rounded-xl border p-3.5 transition cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-400/30"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              {/* Selected visual left bar indicator */}
              {isSelected && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-indigo-600" />
              )}

              <div className="flex items-start justify-between gap-2 pl-1.5">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-md border px-1.5 py-0.5 text-3xs font-bold uppercase tracking-wider ${badgeTone}`}
                    >
                      {subject.code}
                    </span>
                  </div>

                  <h4
                    className={`truncate text-sm font-bold ${
                      isSelected ? "text-indigo-950" : "text-slate-900"
                    }`}
                  >
                    {subject.name}
                  </h4>

                  {subject.description && (
                    <p className="line-clamp-1 text-3xs text-slate-500">
                      {subject.description}
                    </p>
                  )}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={(e) => handleReorderClick(subject.id, "up", e)}
                      className="grid size-5.5 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === subjects.length - 1}
                      onClick={(e) => handleReorderClick(subject.id, "down", e)}
                      className="grid size-5.5 place-items-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="size-3" />
                    </button>
                  </div>

                  {/* Context Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                        />
                      }
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={(e) => handleEditClick(subject, e)}>
                        <Pencil className="size-3.5 mr-2 text-slate-500" />
                        <span>Edit Subject</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => handleDeleteClick(subject, e)}
                      >
                        <Trash2 className="size-3.5 mr-2" />
                        <span>Delete Subject</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Bottom stats row on card */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between pl-1.5 text-xs">
                <span className="font-semibold text-slate-600">
                  {subject.chaptersCount} {subject.chaptersCount === 1 ? "Chapter" : "Chapters"}
                </span>

                <div className="flex items-center gap-1 text-3xs font-semibold text-slate-400 group-hover:text-indigo-600 transition">
                  <span>{isSelected ? "Active View" : "Click to view"}</span>
                  <ChevronRight className="size-3.5" />
                </div>
              </div>
            </div>
          );
        })}

        {subjects.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            No subjects configured yet. Click &quot;Add Subject&quot; above to create one.
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SubjectDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={onAddSubject}
      />

      <SubjectDialog
        open={Boolean(editingSubject)}
        onClose={() => setEditingSubject(null)}
        subject={editingSubject}
        onSave={(data) => {
          if (editingSubject) onEditSubject(editingSubject.id, data);
        }}
      />

      <SubjectDeleteDialog
        open={Boolean(deletingSubject)}
        onClose={() => setDeletingSubject(null)}
        subject={deletingSubject}
        chapterCount={deletingSubject?.chaptersCount || 0}
        onConfirmDelete={onDeleteSubject}
      />
    </aside>
  );
}
