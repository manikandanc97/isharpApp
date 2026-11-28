"use client";

import { CheckCircle2, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BilingualQuestionText } from "@/components/shared/questions/bilingual-question-text";
import { QuestionDiagram } from "@/components/shared/questions/question-diagram";
import type { SelectedQuestionItem } from "../../types";

interface TestEditorDialogsProps {
  confirmDefaultOpen: boolean;
  onConfirmDefaultOpenChange: (open: boolean) => void;
  onApplyDefaultPattern: () => void;
  previewQuestion: SelectedQuestionItem | null;
  onClosePreview: () => void;
}

export function TestEditorDialogs({
  confirmDefaultOpen,
  onConfirmDefaultOpenChange,
  onApplyDefaultPattern,
  previewQuestion,
  onClosePreview,
}: TestEditorDialogsProps) {
  return (
    <>
      <Dialog
        open={confirmDefaultOpen}
        onOpenChange={onConfirmDefaultOpenChange}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Use Default NEET Pattern?</DialogTitle>
            <DialogDescription>
              This applies the standard NEET configuration (180 questions, 180
              minutes, +4 / -1 / 0) without deleting existing saved questions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onConfirmDefaultOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={onApplyDefaultPattern}>
              Apply Default Pattern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(previewQuestion)}
        onOpenChange={(open) => !open && onClosePreview()}
      >
        <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-4 pr-12">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FileQuestion className="size-4 text-brand-blue" />
              Question Preview ({previewQuestion?.externalId})
            </DialogTitle>
          </DialogHeader>
          {previewQuestion && (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4 text-xs">
              <BilingualQuestionText
                textEn={previewQuestion.textEn}
                textTa={previewQuestion.textTa}
                taClassName="text-xs text-slate-600 whitespace-pre-wrap"
              />
              <QuestionDiagram
                src={previewQuestion.questionImageUrl}
                alt="Question"
                className="max-h-48 rounded-lg border border-slate-200 object-contain"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {previewQuestion.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-start gap-2 rounded-lg border p-2 ${
                      opt.isCorrect
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <span className="font-bold">{opt.label}.</span>
                    <div className="min-w-0 flex-1">
                      {opt.textEn && <div>{opt.textEn}</div>}
                      {opt.textTa && (
                        <div className="text-[11px] text-slate-500">
                          {opt.textTa}
                        </div>
                      )}
                      <QuestionDiagram
                        src={opt.imageUrl}
                        alt={`Option ${opt.label}`}
                        className="mt-1 max-h-20 rounded object-contain"
                      />
                    </div>
                    {opt.isCorrect && (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    )}
                  </div>
                ))}
              </div>
              {(previewQuestion.solutionEn ||
                previewQuestion.solutionTa ||
                previewQuestion.solutionImageUrl) && (
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <div className="font-semibold text-brand-blue">Solution</div>
                  {previewQuestion.solutionEn && (
                    <p className="mt-1">{previewQuestion.solutionEn}</p>
                  )}
                  {previewQuestion.solutionTa && (
                    <p className="mt-1 text-slate-600">
                      {previewQuestion.solutionTa}
                    </p>
                  )}
                  <QuestionDiagram
                    src={previewQuestion.solutionImageUrl}
                    alt="Solution"
                    className="mt-2 max-h-32 rounded object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
