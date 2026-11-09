"use client";

import { useState } from "react";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "./student-helpers";
import type { StudentPortalData } from "./student-types";

interface MockInstructionsDialogProps {
  mock: StudentPortalData["mockTests"][number] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MockInstructionsDialog({
  mock,
  open,
  onOpenChange,
}: MockInstructionsDialogProps) {
  const [langTab, setLangTab] = useState<"en" | "ta">("en");

  if (!mock) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-red/10 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-red">
              {mock.code}
            </span>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-brand-blue">
              Official Assessment
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {mock.title}
          </DialogTitle>
          {mock.description && (
            <DialogDescription className="text-xs leading-relaxed text-slate-600">
              {mock.description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Quick Spec Matrix */}
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
            <Clock className="mx-auto size-4 text-brand-blue" />
            <p className="mt-1 text-xs text-slate-500">Duration</p>
            <p className="font-semibold text-slate-900">{mock.durationMinutes} Mins</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
            <Award className="mx-auto size-4 text-emerald-600" />
            <p className="mt-1 text-xs text-slate-500">Total Marks</p>
            <p className="font-semibold text-slate-900">{mock.totalMarks} Marks</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
            <FileQuestion className="mx-auto size-4 text-purple-600" />
            <p className="mt-1 text-xs text-slate-500">Questions</p>
            <p className="font-semibold text-slate-900">{mock.questionCount} Qs</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
            <Calendar className="mx-auto size-4 text-amber-600" />
            <p className="mt-1 text-xs text-slate-500">Scheduled</p>
            <p className="truncate text-xs font-semibold text-slate-900">
              {formatDate(mock.scheduledAt)}
            </p>
          </div>
        </div>

        {/* Standard Exam Rules */}
        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-semibold">Marking Scheme & Exam Integrity</p>
              <ul className="list-inside list-disc space-y-0.5 text-amber-800">
                <li>+4 Marks awarded for each correct attempt.</li>
                <li>-1 Mark deducted for each incorrect MCQ answer.</li>
                <li>0 Marks for unattempted questions. No penalty for skipped items.</li>
                <li>Timer starts immediately when test engine commences.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bilingual Instructions Viewer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Candidate Instructions
            </span>
            <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLangTab("en")}
                className={`rounded-full px-3 py-0.5 transition ${
                  langTab === "en"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLangTab("ta")}
                className={`rounded-full px-3 py-0.5 transition ${
                  langTab === "ta"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-xs leading-relaxed text-slate-700">
            {langTab === "en" ? (
              mock.instructionsEn ? (
                <p className="whitespace-pre-line">{mock.instructionsEn}</p>
              ) : (
                <p className="italic text-slate-400">
                  Standard NEET/JEE assessment protocol applies. Ensure uninterrupted internet connectivity and a quiet environment.
                </p>
              )
            ) : mock.instructionsTa ? (
              <p className="whitespace-pre-line font-sans">{mock.instructionsTa}</p>
            ) : (
              <p className="italic text-slate-400">
                தேர்வு விதிகள்: நேரக் கட்டுப்பாட்டை பின்பற்றவும், அனைத்து வினாக்களுக்கும் கவனமாக விடையளிக்கவும்.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs font-medium"
          >
            Close Guidelines
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              alert(
                `Mock test session lobby for "${mock.title}" will open when the proctoring countdown begins. Ensure your device is prepared!`
              );
            }}
            className="rounded-full bg-brand-red text-xs font-semibold text-white shadow-primary hover:bg-brand-red-hover"
          >
            <CheckCircle2 className="mr-1.5 size-4" />
            I Understand & Agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
