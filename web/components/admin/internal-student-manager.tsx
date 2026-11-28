"use client";

import { useState } from "react";
import {
  AlertCircle,
  Check,
  LoaderCircle,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <DialogContent className="max-w-lg p-6">
          {editing && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveStudent();
              }}
              className="space-y-4"
            >
              <DialogHeader>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-red">
                  Internal student
                </p>
                <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                  {editing === "edit"
                    ? "Edit internal student"
                    : "Add internal student"}
                </DialogTitle>
                <DialogDescription className="text-xs leading-5 text-slate-500">
                  Enter the exact email the student will use to register. A
                  matching email receives free access automatically; all other
                  student accounts require a paid plan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="student-name" className="text-xs font-semibold text-slate-700">
                    Student name *
                  </Label>
                  <Input
                    id="student-name"
                    autoFocus
                    required
                    minLength={2}
                    maxLength={150}
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder="Student full name"
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="student-email" className="text-xs font-semibold text-slate-700">
                    Login email *
                  </Label>
                  <Input
                    id="student-email"
                    required
                    maxLength={320}
                    autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="student@example.com"
                    className="text-xs"
                  />
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                  disabled={saving}
                  className="text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !form.fullName.trim() || !form.email.trim()}
                  className="bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
                >
                  {saving ? (
                    <LoaderCircle className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 size-4" />
                  )}
                  {saving
                    ? "Saving…"
                    : editing === "edit"
                      ? "Update student"
                      : "Save student"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

