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
} from "lucide-react";
import type { LanguageMode, SubjectMode } from "./demo-test.types";
import type { CountOption } from "./use-demo-test-workflow";
import { DemoTestLobbySummary } from "./demo-test-lobby-summary";

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
    title: "இயற்பியல்",
    desc: "Physics Only",
    icon: Atom,
    badge: "Subject Drill",
  },
  {
    id: "CHEMISTRY" as SubjectMode,
    title: "வேதியியல்",
    desc: "Chemistry Only",
    icon: FlaskConical,
    badge: "Subject Drill",
  },
  {
    id: "BIOLOGY" as SubjectMode,
    title: "உயிரியல்",
    desc: "Biology Only",
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
    : "space-y-2.5 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs sm:p-5";

  return (
    <div>
      {errorMsg && (
        <div
          className={
            isDialog
              ? "mx-6 mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 sm:mx-8"
              : "mb-4 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
          }
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div
        className={
          isDialog
            ? "grid grid-cols-1 gap-6 p-6 sm:p-8 lg:grid-cols-12"
            : "grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
        }
      >
        <div
          className={
            isDialog ? "space-y-5 lg:col-span-7" : "space-y-4 lg:col-span-7"
          }
        >
          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Layers className="size-3.5 text-brand-red" />
                <span>1. Select Subject</span>
              </label>
              <span className="text-2xs font-semibold text-slate-400">
                Separate or Mixed
              </span>
            </div>

            <div
              className={
                isDialog
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-2 gap-2.5"
              }
            >
              {SUBJECT_OPTIONS.filter((item) =>
                allowedSubjects.includes(item.id),
              ).map((item) => {
                const isSelected = subjectMode === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSubjectChange(item.id)}
                    className={`group relative flex flex-col justify-between rounded-2xl border text-left transition-all duration-150 ${
                      isDialog ? "p-3" : "p-3.5"
                    } ${
                      isSelected
                        ? "border-brand-red bg-rose-50/40 shadow-xs ring-2 ring-brand-red/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`grid place-items-center rounded-lg ${
                          isDialog ? "size-7" : "size-7.5"
                        } ${
                          isSelected
                            ? "bg-brand-red text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-2xs font-extrabold uppercase ${
                          isSelected
                            ? "bg-rose-100 text-brand-red"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <div className={isDialog ? "mt-2.5" : "mt-3"}>
                      <p className="text-xs font-bold leading-snug text-slate-900 sm:text-sm">
                        {item.title}
                      </p>
                      <p className="font-sans text-2xs font-medium text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Languages className="size-3.5 text-brand-blue" />
                <span>2. Select Language</span>
              </label>
              <span className="text-2xs font-semibold text-slate-400">
                Strictly English vs Dual
              </span>
            </div>

            <div
              className={
                isDialog
                  ? "grid grid-cols-2 gap-2.5"
                  : "grid grid-cols-1 gap-3 sm:grid-cols-2"
              }
            >
              {allowedLanguages.includes("ta") && (
                <button
                  type="button"
                  onClick={() => onLanguageChange("ta")}
                  className={`flex flex-col justify-between rounded-2xl border text-left transition-all ${
                    isDialog ? "p-3.5" : "p-4"
                  } ${
                    languageMode === "ta"
                      ? "border-brand-red bg-rose-50/40 shadow-xs ring-2 ring-brand-red/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Languages className="size-4 text-amber-600" />
                      <span className="font-sans text-xs font-bold text-slate-900 sm:text-sm">
                        தமிழ் + English
                      </span>
                    </div>
                    {languageMode === "ta" && (
                      <Check className="size-4 text-brand-red" />
                    )}
                  </div>
                  <p
                    className={`${isDialog ? "mt-1.5" : "mt-2"} text-2xs leading-relaxed text-slate-500`}
                  >
                    {isDialog
                      ? "Bilingual dual view: Tamil translation with English terminology."
                      : "Bilingual dual view: Tamil translation accompanied by standard English terminology."}
                  </p>
                </button>
              )}

              {allowedLanguages.includes("en") && (
                <button
                  type="button"
                  onClick={() => onLanguageChange("en")}
                  className={`flex flex-col justify-between rounded-2xl border text-left transition-all ${
                    isDialog ? "p-3.5" : "p-4"
                  } ${
                    languageMode === "en"
                      ? "border-brand-red bg-rose-50/40 shadow-xs ring-2 ring-brand-red/30"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="size-4 text-brand-blue" />
                      <span className="text-xs font-bold text-slate-900 sm:text-sm">
                        English Only
                      </span>
                    </div>
                    {languageMode === "en" && (
                      <Check className="size-4 text-brand-red" />
                    )}
                  </div>
                  <p
                    className={`${isDialog ? "mt-1.5" : "mt-2"} text-2xs leading-relaxed text-slate-500`}
                  >
                    {isDialog
                      ? "Pure English questions, options, and explanations without Tamil."
                      : "Questions, options, and step-by-step solutions purely in English without Tamil."}
                  </p>
                </button>
              )}
            </div>
          </div>

          <div className={sectionWrapperClass}>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Clock className="size-3.5 text-emerald-600" />
                <span>3. Choose Test Duration</span>
              </label>
              <span className="text-2xs font-semibold text-slate-400">
                {countOptions.length > 1
                  ? `${countOptions.length} Formats`
                  : "Configured"}
              </span>
            </div>

            <div
              className={
                isDialog
                  ? "grid grid-cols-2 gap-2 sm:grid-cols-3"
                  : "grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3"
              }
            >
              {countOptions.map((item) => {
                const isChosen = questionCount === item.count;
                const hasCustomLabel =
                  item.label &&
                  item.label.toLowerCase() !== `${item.count} questions` &&
                  item.label.toLowerCase() !== `${item.count} qs`;
                return (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => onQuestionCountChange(item.count)}
                    className={`rounded-2xl border text-left transition-all ${
                      isDialog ? "p-3" : "p-3.5"
                    } ${
                      isChosen
                        ? "border-brand-red bg-rose-50/40 shadow-xs ring-2 ring-brand-red/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="whitespace-nowrap text-xs font-bold text-slate-900 sm:text-sm">
                        {item.count} Qs
                      </span>
                      <span
                        className={`rounded-md bg-rose-100/80 py-0.5 font-mono text-2xs font-extrabold text-brand-red ${
                          isDialog ? "px-1.5" : "px-2"
                        }`}
                      >
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-2xs font-medium text-slate-500">
                      {hasCustomLabel ? item.label : item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DemoTestLobbySummary
          isDialog={isDialog}
          testCode={testCode}
          totalPossibleMarks={totalPossibleMarks}
          estimatedMinutes={estimatedMinutes}
          subjectName={subjectMeta.name}
          languageMode={languageMode}
          onStartExam={onStartExam}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
