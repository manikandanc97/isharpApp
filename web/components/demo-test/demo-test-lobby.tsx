"use client";

import {
  AlertCircle,
  Atom,
  Check,
  Clock,
  Dna,
  FlaskConical,
  Globe,
  Languages,
  Layers,
  Play,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LanguageMode, SubjectMode } from "./demo-test.types";
import type { CountOption } from "./use-demo-test-workflow";

export interface DemoTestLobbyProps {
  variant?: "dialog" | "screen";
  subjectMode: SubjectMode;
  onSubjectChange: (mode: SubjectMode) => void;
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  countOptions: CountOption[];
  totalPossibleMarks: number;
  estimatedMinutes: number;
  subjectMeta: { name: string; sub: string };
  errorMsg: string;
  onStartExam: () => void;
  onCancel: () => void;
  allowedSubjects?: SubjectMode[];
  allowedLanguages?: LanguageMode[];
  testCode?: string;
}

const SUBJECT_OPTIONS = [
  {
    id: "PHYSICS" as SubjectMode,
    title: "Physics Only",
    desc: "இயற்பியல்",
    icon: Atom,
    badge: "Subject Drill",
  },
  {
    id: "CHEMISTRY" as SubjectMode,
    title: "Chemistry Only",
    desc: "வேதியியல்",
    icon: FlaskConical,
    badge: "Subject Drill",
  },
  {
    id: "BIOLOGY" as SubjectMode,
    title: "Biology Only",
    desc: "உயிரியல்",
    icon: Dna,
    badge: "Subject Drill",
  },
  {
    id: "ALL" as SubjectMode,
    title: "All 3 Subjects",
    desc: "Phy + Chem + Bio",
    icon: Layers,
    badge: "NEET Mock",
  },
];

export function DemoTestLobby({
  variant = "dialog",
  subjectMode,
  onSubjectChange,
  languageMode,
  onLanguageChange,
  questionCount,
  onQuestionCountChange,
  countOptions,
  totalPossibleMarks,
  estimatedMinutes,
  subjectMeta,
  errorMsg,
  onStartExam,
  onCancel,
  allowedSubjects = ["ALL", "PHYSICS", "CHEMISTRY", "BIOLOGY"],
  allowedLanguages = ["en", "ta"],
  testCode = "NEET-DEMO-2026",
}: DemoTestLobbyProps) {
  const isDialog = variant === "dialog";

  const sectionWrapperClass = isDialog
    ? "space-y-2"
    : "rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-2.5";

  return (
    <div>
      {errorMsg && (
        <div
          className={
            isDialog
              ? "mx-6 mt-4 sm:mx-8 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2"
              : "mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-center gap-2.5"
          }
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-Column Responsive Body */}
      <div
        className={
          isDialog
            ? "grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8"
            : "grid grid-cols-1 lg:grid-cols-12 gap-5 items-start"
        }
      >
        {/* Left Column: Configuration Controls (lg:col-span-7) */}
        <div className={isDialog ? "lg:col-span-7 space-y-5" : "lg:col-span-7 space-y-4"}>
          {/* 1. SUBJECT SELECTION */}
          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="size-3.5 text-brand-red" />
                <span>1. Select Subject</span>
              </label>
              <span className="text-2xs font-semibold text-slate-400">Separate or Mixed</span>
            </div>

            <div className={isDialog ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-2.5"}>
              {SUBJECT_OPTIONS.filter((item) => allowedSubjects.includes(item.id)).map((item) => {
                const isSelected = subjectMode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSubjectChange(item.id)}
                    className={`group relative flex flex-col justify-between rounded-2xl border ${
                      isDialog ? "p-3" : "p-3.5"
                    } text-left transition-all duration-150 ${
                      isSelected
                        ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`grid ${
                          isDialog ? "size-7" : "size-7.5"
                        } place-items-center rounded-lg ${
                          isSelected ? "bg-brand-red text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className={`text-2xs font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? "bg-rose-100 text-brand-red"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className={isDialog ? "mt-2.5" : "mt-3"}>
                      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-2xs text-slate-500 font-medium font-sans">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. LANGUAGE PREFERENCE */}
          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Languages className="size-3.5 text-brand-blue" />
                <span>2. Select Language</span>
              </label>
              <span className="text-2xs font-semibold text-slate-400">Strictly English vs Dual</span>
            </div>

            <div className={isDialog ? "grid grid-cols-2 gap-2.5" : "grid grid-cols-1 sm:grid-cols-2 gap-3"}>
              {allowedLanguages.includes("en") && <button
                type="button"
                onClick={() => onLanguageChange("en")}
                className={`flex flex-col justify-between rounded-2xl border ${
                  isDialog ? "p-3.5" : "p-4"
                } text-left transition-all ${
                  languageMode === "en"
                    ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-brand-blue" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900">English Only</span>
                  </div>
                  {languageMode === "en" && <Check className="size-4 text-brand-red" />}
                </div>
                <p className={`${isDialog ? "mt-1.5" : "mt-2"} text-2xs text-slate-500 leading-relaxed`}>
                  {isDialog
                    ? "Pure English questions, options, and explanations without Tamil."
                    : "Questions, options, and step-by-step solutions purely in English without Tamil."}
                </p>
              </button>}

              {allowedLanguages.includes("ta") && <button
                type="button"
                onClick={() => onLanguageChange("ta")}
                className={`flex flex-col justify-between rounded-2xl border ${
                  isDialog ? "p-3.5" : "p-4"
                } text-left transition-all ${
                  languageMode === "ta"
                    ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages className="size-4 text-amber-600" />
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-sans">
                      தமிழ் + English
                    </span>
                  </div>
                  {languageMode === "ta" && <Check className="size-4 text-brand-red" />}
                </div>
                <p className={`${isDialog ? "mt-1.5" : "mt-2"} text-2xs text-slate-500 leading-relaxed`}>
                  {isDialog
                    ? "Bilingual dual view: Tamil translation with English terminology."
                    : "Bilingual dual view: Tamil translation accompanied by standard English terminology."}
                </p>
              </button>}
            </div>
          </div>

          {/* 3. QUESTION PAPER LENGTH */}
          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock className="size-3.5 text-emerald-600" />
                <span>3. Choose Test Duration</span>
              </label>
            </div>

            <div className={isDialog ? "grid grid-cols-3 gap-2" : "grid grid-cols-3 gap-2.5"}>
              {countOptions.map((item) => {
                const isChosen = questionCount === item.count;
                return (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => onQuestionCountChange(item.count)}
                    className={`rounded-2xl border ${
                      isDialog ? "p-3" : "p-3.5"
                    } text-left transition-all ${
                      isChosen
                        ? "border-brand-red bg-rose-50/40 ring-2 ring-brand-red/30 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 whitespace-nowrap">
                        {item.count} Qs
                      </span>
                      <span
                        className={`rounded-md bg-rose-100/80 ${
                          isDialog ? "px-1.5" : "px-2"
                        } py-0.5 font-mono text-2xs font-extrabold text-brand-red`}
                      >
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-1 text-2xs text-slate-500 font-medium truncate">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Examination Admit Blueprint & Launch Card (lg:col-span-5) */}
        <div
          className={`lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200/90 ${
            isDialog ? "bg-slate-50/80 p-5 space-y-4" : "bg-white p-5 sm:p-6 shadow-xs space-y-4"
          }`}
        >
          <div className="space-y-4">
            <div
              className={`flex items-center justify-between border-b ${
                isDialog ? "border-slate-200/70 pb-3" : "border-slate-100 pb-3.5"
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className={isDialog ? "size-4.5 text-brand-red" : "size-5 text-brand-red"} />
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
                className={`font-mono text-2xs font-bold ${
                  isDialog
                    ? "text-slate-500 bg-white px-2 py-0.5"
                    : "text-slate-600 bg-slate-50 px-2 py-1 rounded-md"
                } rounded border border-slate-200`}
              >
                {testCode}
              </span>
            </div>

            {/* Summary Spec Grid */}
            <div className={`grid grid-cols-2 ${isDialog ? "gap-2" : "gap-3"} text-xs`}>
              <div
                className={`rounded-2xl border ${
                  isDialog ? "border-slate-200 bg-white p-3" : "border-slate-100 bg-slate-50/70 p-3.5"
                }`}
              >
                <span className="text-2xs font-semibold uppercase text-slate-400">Total Marks</span>
                <p className={`${isDialog ? "text-lg" : "text-xl"} font-black text-slate-900 mt-0.5`}>
                  {totalPossibleMarks} Marks
                </p>
                <span className="text-2xs text-emerald-600 font-medium">+4 for correct</span>
              </div>

              <div
                className={`rounded-2xl border ${
                  isDialog ? "border-slate-200 bg-white p-3" : "border-slate-100 bg-slate-50/70 p-3.5"
                }`}
              >
                <span className="text-2xs font-semibold uppercase text-slate-400">Duration</span>
                <p className={`${isDialog ? "text-lg" : "text-xl"} font-black text-brand-blue mt-0.5`}>
                  {estimatedMinutes} Mins
                </p>
                <span className="text-2xs text-slate-500 font-medium">Timed countdown</span>
              </div>
            </div>

            <div
              className={`rounded-2xl border ${
                isDialog ? "border-slate-200 bg-white p-3" : "border-slate-100 bg-slate-50/70 p-3.5"
              } space-y-1`}
            >
              <span className="text-2xs font-semibold uppercase text-slate-400">
                Configured Format
              </span>
              <p className={`text-xs ${!isDialog ? "sm:text-sm" : ""} font-bold text-slate-900`}>
                {subjectMeta.name}
              </p>
              <p className="text-2xs text-slate-500">
                Language:{" "}
                <strong className="text-slate-800">
                  {languageMode === "en" ? "English Only" : "தமிழ் + English Both"}
                </strong>
              </p>
            </div>

            {/* NTA Rules Pill */}
            <div
              className={`rounded-2xl border border-amber-200 bg-amber-50/70 ${
                isDialog ? "p-3" : "p-3.5"
              } space-y-1 text-2xs text-amber-900`}
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <ShieldAlert className={isDialog ? "size-3.5 text-amber-600" : "size-4 text-amber-600"} />
                <span>NTA Marking Protocol</span>
              </div>
              <ul className="list-inside list-disc space-y-0.5 text-amber-800">
                <li>+4 Marks awarded for each correct attempt.</li>
                <li>-1 Mark deducted for wrong attempts.</li>
                <li>0 Marks for {isDialog ? "skipped" : "unattempted"} questions.</li>
                {!isDialog && <li>Full-screen distraction-free CBT interface.</li>}
              </ul>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={onStartExam}
              className={`w-full rounded-full bg-brand-red hover:bg-brand-red-hover ${
                isDialog ? "py-3" : "py-3.5"
              } text-xs sm:text-sm font-bold text-white shadow-primary hover:shadow-primary-hover active:scale-95 transition-all`}
            >
              <Play className="size-4 mr-2 fill-current" />
              <span>
                Start Free Demo Test
              </span>
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
      </div>
    </div>
  );
}
