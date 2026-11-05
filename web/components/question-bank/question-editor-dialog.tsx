"use client";

import { LoaderCircle, Pencil, Plus, X } from "lucide-react";
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
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={editingId ? "Edit question" : "Add question"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="mx-auto my-2 max-w-5xl overflow-hidden rounded-3xl border border-white/20 bg-white shadow-2xl sm:my-6">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Assessment editor
            </p>
            <h3 className="mt-1 type-section-title text-slate-950">
              {editingId
                ? "Edit question"
                : `Add ${subjectFilter[0] + subjectFilter.slice(1).toLowerCase()} question`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close question editor"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-5 bg-slate-50/50 p-5 sm:p-7">
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
          <div className="grid gap-3 md:grid-cols-4">
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
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              >
                <option>SINGLE_CORRECT</option>
                <option>MULTIPLE_CORRECT</option>
                <option>NUMERICAL</option>
              </select>
            </Field>
            <Field label="Language">
              <select
                value={draft.language}
                onChange={(e) =>
                  setDraft({ ...draft, language: e.target.value })
                }
              >
                <option>BILINGUAL</option>
                <option>ENGLISH</option>
                <option>TAMIL</option>
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
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSave()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-3 font-semibold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : editingId ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}{" "}
            {editingId ? "Update question" : "Add question"} (+4 / −1)
          </button>
        </div>
      </div>
    </div>
  );
}
