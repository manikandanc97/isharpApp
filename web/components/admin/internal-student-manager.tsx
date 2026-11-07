"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Pencil,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "./admin-api";
import type { InternalStudent } from "./admin-types";

export function RosterActions({
  student,
  deleting,
  onEdit,
  onDelete,
}: {
  student: InternalStudent;
  deleting: boolean;
  onEdit: (student: InternalStudent) => void;
  onDelete: (student: InternalStudent) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="secondary-soft"
        size="sm"
        onClick={() => onEdit(student)}
      >
        <Pencil data-icon="inline-start" />
        Edit
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={deleting}
        aria-busy={deleting}
        onClick={() => onDelete(student)}
      >
        {deleting ? (
          <LoaderCircle data-icon="inline-start" className="animate-spin" />
        ) : (
          <Trash2 data-icon="inline-start" />
        )}
        Delete
      </Button>
    </div>
  );
}

export function InternalStudentManager({
  editStudent,
  onEditClosed,
  onCreated,
  onNotice,
  onError,
}: {
  editStudent: InternalStudent | null;
  onEditClosed: () => void;
  onCreated: (student: InternalStudent) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState<"new" | "edit" | null>(
    editStudent ? "edit" : null,
  );
  const [form, setForm] = useState({
    fullName: editStudent?.fullName ?? "",
    email: editStudent?.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function closeEditor() {
    setEditing(null);
    onEditClosed();
  }

  function openCreate() {
    onEditClosed();
    setForm({ fullName: "", email: "" });
    setFormError("");
    setEditing("new");
  }

  async function saveStudent() {
    if (!editing) return;
    setSaving(true);
    setFormError("");
    try {
      const isEditingExisting = editing === "edit" && editStudent;
      const saved = await api<InternalStudent>(
        isEditingExisting
          ? `internal-students/${editStudent.id}`
          : "internal-students",
        {
          method: isEditingExisting ? "PATCH" : "POST",
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
          }),
        },
      );
      onCreated(saved);
      closeEditor();
      onNotice(
        isEditingExisting
          ? `${saved.fullName || "Internal student"} was updated.`
          : `${saved.fullName || "Internal student"} was added. This email will receive free access automatically on signup.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Internal student could not be saved";
      setFormError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        onClick={openCreate}
        className="h-10 shrink-0 bg-brand-red px-4 text-white hover:bg-brand-red-hover"
      >
        <UserPlus className="mr-2 size-4" />
        Add internal student
      </Button>
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open && !saving) closeEditor();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-lg"
        >
          {editing && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveStudent();
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
                    Internal student
                  </p>
                  <DialogTitle className="mt-1 type-section-title text-slate-900">
                    {editing === "edit"
                      ? "Edit internal student"
                      : "Add internal student"}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs leading-5 text-slate-500">
                    Enter the exact email the student will use to register. A
                    matching email receives free access automatically; all other
                    student accounts require a paid plan.
                  </DialogDescription>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={closeEditor}
                  className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close student form"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                  Student name
                  <input
                    autoFocus
                    required
                    minLength={2}
                    maxLength={150}
                    autoComplete="name"
                    className="h-11 rounded-xl border border-slate-300 px-3.5 font-medium outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Student name"
                  />
                </label>
                <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                  Login email
                  <input
                    required
                    maxLength={320}
                    autoComplete="email"
                    className="h-11 rounded-xl border border-slate-300 px-3.5 font-medium outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-blue-100"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="student@example.com"
                  />
                </label>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !form.fullName.trim() || !form.email.trim()}
                  className="bg-brand-red text-white hover:bg-brand-red-hover"
                >
                  {saving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 size-4" />
                  )}
                  {saving
                    ? "Saving…"
                    : editing === "edit"
                      ? "Update student"
                      : "Save student"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

