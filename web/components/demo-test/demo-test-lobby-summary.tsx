"use client";

import { Play, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LanguageMode } from "./demo-test.types";

interface DemoTestLobbySummaryProps {
  isDialog: boolean;
  testCode: string;
  totalPossibleMarks: number;
  estimatedMinutes: number;
  subjectName: string;
  languageMode: LanguageMode;
  onStartExam: () => void;
  onCancel: () => void;
}

export function DemoTestLobbySummary({
  isDialog,
  testCode,
  totalPossibleMarks,
  estimatedMinutes,
  subjectName,
  languageMode,
  onStartExam,
  onCancel,
}: DemoTestLobbySummaryProps) {
  return (
    <div
      className={`flex flex-col justify-between rounded-3xl border border-slate-200/90 lg:col-span-5 ${
        isDialog
          ? "space-y-4 bg-slate-50/80 p-5"
          : "space-y-4 bg-white p-5 shadow-xs sm:p-6"
      }`}
    >
      <div className="space-y-4">
        <div
          className={`flex items-center justify-between border-b ${
            isDialog ? "border-slate-200/70 pb-3" : "border-slate-100 pb-3.5"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className={
                isDialog
                  ? "size-4.5 text-brand-red"
                  : "size-5 text-brand-red"
              }
            />
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900">
                Your Test Summary
              </span>
              {!isDialog && (
                <p className="text-2xs text-slate-400">Free NEET Demo Test</p>
              )}
            </div>
          </div>
          <span
            className={`rounded border border-slate-200 font-mono text-2xs font-bold ${
              isDialog
                ? "bg-white px-2 py-0.5 text-slate-500"
                : "rounded-md bg-slate-50 px-2 py-1 text-slate-600"
            }`}
          >
            {testCode}
          </span>
        </div>

        <div
          className={`grid grid-cols-2 ${isDialog ? "gap-2" : "gap-3"} text-xs`}
        >
          <div
            className={`rounded-2xl border ${
              isDialog
                ? "border-slate-200 bg-white p-3"
                : "border-slate-100 bg-slate-50/70 p-3.5"
            }`}
          >
            <span className="text-2xs font-semibold uppercase text-slate-400">
              Total Marks
            </span>
            <p
              className={`${isDialog ? "text-lg" : "text-xl"} mt-0.5 font-black text-slate-900`}
            >
              {totalPossibleMarks} Marks
            </p>
            <span className="text-2xs font-medium text-emerald-600">
              +4 for correct
            </span>
          </div>

          <div
            className={`rounded-2xl border ${
              isDialog
                ? "border-slate-200 bg-white p-3"
                : "border-slate-100 bg-slate-50/70 p-3.5"
            }`}
          >
            <span className="text-2xs font-semibold uppercase text-slate-400">
              Duration
            </span>
            <p
              className={`${isDialog ? "text-lg" : "text-xl"} mt-0.5 font-black text-brand-blue`}
            >
              {estimatedMinutes} Mins
            </p>
            <span className="text-2xs font-medium text-slate-500">
              Timed countdown
            </span>
          </div>
        </div>

        <div
          className={`space-y-1 rounded-2xl border ${
            isDialog
              ? "border-slate-200 bg-white p-3"
              : "border-slate-100 bg-slate-50/70 p-3.5"
          }`}
        >
          <span className="text-2xs font-semibold uppercase text-slate-400">
            Configured Format
          </span>
          <p
            className={`text-xs ${!isDialog ? "sm:text-sm" : ""} font-bold text-slate-900`}
          >
            {subjectName}
          </p>
          <p className="text-2xs text-slate-500">
            Language:{" "}
            <strong className="text-slate-800">
              {languageMode === "en" ? "English Only" : "தமிழ் + English Both"}
            </strong>
          </p>
        </div>

        <div
          className={`space-y-1 rounded-2xl border border-amber-200 bg-amber-50/70 text-2xs text-amber-900 ${
            isDialog ? "p-3" : "p-3.5"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <ShieldAlert
              className={
                isDialog
                  ? "size-3.5 text-amber-600"
                  : "size-4 text-amber-600"
              }
            />
            <span>NTA Marking Protocol</span>
          </div>
          <ul className="list-inside list-disc space-y-0.5 text-amber-800">
            <li>+4 Marks awarded for each correct attempt.</li>
            <li>-1 Mark deducted for wrong attempts.</li>
            <li>
              0 Marks for {isDialog ? "skipped" : "unattempted"} questions.
            </li>
            {!isDialog && (
              <li>Full-screen distraction-free CBT interface.</li>
            )}
          </ul>
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <Button
          onClick={onStartExam}
          className={`w-full rounded-full bg-brand-red shadow-primary transition-all hover:bg-brand-red-hover hover:shadow-primary-hover active:scale-95 ${
            isDialog ? "py-3" : "py-3.5"
          } text-xs font-bold text-white sm:text-sm`}
        >
          <Play className="mr-2 size-4 fill-current" />
          <span>Start Free Demo Test</span>
        </Button>
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full rounded-full text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          {isDialog ? "Cancel & Return" : "Return to Home"}
        </Button>
      </div>
    </div>
  );
}
