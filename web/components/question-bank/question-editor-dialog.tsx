"use client";

import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Draft } from "./types";
import { Field, ImageField } from "./helpers";
import { QuestionOptionsEditor } from "./question-options-editor";

export function QuestionEditorDialog({
  open,
  onClose,
  editingId,
  subjectFilter,
  draft,
  setDraft,
  patchOption,
  chooseCorrect,
  uploadImage,
  onSave,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  editingId: string | null;
  subjectFilter: "PHYSICS" | "CHEMISTRY" | "BIOLOGY";
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  patchOption: (index: number, patch: Partial<Draft["options"][number]>) => void;
  chooseCorrect: (index: number) => void;
  uploadImage: (file: File, apply: (url: string) => void) => Promise<void>;
  onSave: () => Promise<void>;
  busy: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !busy && onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">
            Assessment editor
          </p>
          <DialogTitle className="mt-1 text-base sm:text-lg font-bold text-slate-950">
            {editingId
              ? "Edit question"
              : `Add ${subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} question`}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Configure question metadata, bilingual text, options, and step-by-step explanations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 bg-slate-50/50 p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="External ID">
              <input
                value={draft.externalId}
                readOnly={Boolean(editingId)}
                onChange={(e) =>
                  setDraft({ ...draft, externalId: e.target.value })
                }
              />
            </Field>
            <Field label="Course">
              <input value="NEET" readOnly />
            </Field>
            <Field label="Subject">
              <input
                value={
                  subjectFilter[0] + subjectFilter.slice(1).toLowerCase()
                }
                readOnly
              />
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Field label="Chapter (exact)">
              <input
                value={draft.chapterTitle}
                onChange={(e) =>
                  setDraft({ ...draft, chapterTitle: e.target.value })
                }
              />
            </Field>
            <Field label="Type">
              <select
                value={draft.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setDraft((prev) => {
                    let newOptions = prev.options;
                    if (newType === "SINGLE_CORRECT") {
                      let foundFirst = false;
                      newOptions = prev.options.map((opt) => {
                        if (opt.isCorrect && !foundFirst) {
                          foundFirst = true;
                          return opt;
                        }
                        return { ...opt, isCorrect: false };
                      });
                      if (!foundFirst && newOptions.length > 0) {
                        newOptions[0] = { ...newOptions[0], isCorrect: true };
                      }
                    }
                    return { ...prev, type: newType, options: newOptions };
                  });
                }}
              >
                <option>SINGLE_CORRECT</option>
                <option>MULTIPLE_CORRECT</option>
                <option>NUMERICAL</option>
              </select>
            </Field>
            <Field label="Difficulty">
              <select
                value={draft.difficulty}
                onChange={(e) =>
                  setDraft({ ...draft, difficulty: e.target.value })
                }
              >
                <option>EASY</option>
                <option>MEDIUM</option>
                <option>HARD</option>
              </select>
            </Field>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Question — English">
              <textarea
                rows={3}
                value={draft.textEn}
                onChange={(e) =>
                  setDraft({ ...draft, textEn: e.target.value })
                }
              />
            </Field>
            <Field label="கேள்வி — தமிழ்">
              <textarea
                rows={3}
                value={draft.textTa}
                onChange={(e) =>
                  setDraft({ ...draft, textTa: e.target.value })
                }
              />
            </Field>
          </div>
          <ImageField
            label="Question diagram"
            url={draft.questionImageUrl}
            onUpload={(file) =>
              void uploadImage(file, (url) =>
                setDraft((current) => ({
                  ...current,
                  questionImageUrl: url,
                })),
              )
            }
          />
          {draft.type === "NUMERICAL" ? (
            <Field label="Numerical answer">
              <input
                value={draft.numericalAnswer}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    numericalAnswer: e.target.value,
                  })
                }
              />
            </Field>
          ) : (
            <QuestionOptionsEditor
              options={draft.options}
              chooseCorrect={chooseCorrect}
              patchOption={patchOption}
              uploadImage={uploadImage}
            />
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Solution — English">
              <textarea
                rows={3}
                value={draft.solutionEn}
                onChange={(e) =>
                  setDraft({ ...draft, solutionEn: e.target.value })
                }
              />
            </Field>
            <Field label="தீர்வு — தமிழ்">
              <textarea
                rows={3}
                value={draft.solutionTa}
                onChange={(e) =>
                  setDraft({ ...draft, solutionTa: e.target.value })
                }
              />
            </Field>
          </div>
          <ImageField
            label="Solution image"
            url={draft.solutionImageUrl}
            onUpload={(file) =>
              void uploadImage(file, (url) =>
                setDraft((current) => ({
                  ...current,
                  solutionImageUrl: url,
                })),
              )
            }
          />
          <Field label="Source / reference">
            <input
              value={draft.source}
              onChange={(e) =>
                setDraft({ ...draft, source: e.target.value })
              }
              placeholder="NCERT / NEET 2025 / Institute module"
            />
          </Field>
        </div>

        <DialogFooter className="px-6 py-3.5 border-t border-slate-100 bg-white shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
            className="text-xs font-medium"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void onSave()}
            className="bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin mr-1.5" />
            ) : editingId ? (
              <Pencil className="size-4 mr-1.5" />
            ) : (
              <Plus className="size-4 mr-1.5" />
            )}
            {editingId ? "Update question" : "Add question"} (+4 / −1)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
