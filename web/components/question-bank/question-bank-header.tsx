"use client";

import Link from "next/link";
import {
  BookOpenCheck,
  ClipboardCheck,
  FileDown,
  FileQuestion,
  FileSpreadsheet,
  Plus,
  Target,
} from "lucide-react";

import { Stack } from "@/components/layout/layout-primitives";

interface QuestionBankHeaderProps {
  questionsCount: number;
  testsCount: number;
  selectedCount: number;
  onCreateQuestion: () => void;
  onOpenImport: () => void;
}

export function QuestionBankHeader({
  questionsCount,
  testsCount,
  selectedCount,
  onCreateQuestion,
  onOpenImport,
}: QuestionBankHeaderProps) {
  const metrics = [
    {
      label: "Questions",
      detail: "Library records",
      value: questionsCount,
      icon: FileQuestion,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Mock tests",
      detail: "Assessment drafts",
      value: testsCount,
      icon: ClipboardCheck,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Selected",
      detail: "Ready for test",
      value: selectedCount,
      icon: Target,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-6 sm:px-7 sm:py-7">
      <Stack gap="lg">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <Stack gap="sm" className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              <BookOpenCheck className="size-3.5" /> Content operations
            </div>
            <h2 className="type-page-title text-slate-950">
              Assessment content
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Build and maintain bilingual NEET questions, syllabus coverage,
              and mock assessments from one workspace.
            </p>
          </Stack>
          <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-3">
            <button
              type="button"
              onClick={onCreateQuestion}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-navy px-5 text-xs font-semibold text-white transition hover:bg-brand-navy/90 active:scale-95 shadow-xs"
            >
              <Plus className="size-4" /> Add question
            </button>
            <Link
              href="/api/admin/questions/template"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-95 shadow-2xs"
            >
              <FileDown className="size-4" /> Template
            </Link>
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-95 shadow-2xs"
            >
              <FileSpreadsheet className="size-4" /> Import Excel
            </button>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`flex items-center gap-3 px-4 py-3.5 sm:px-5 ${index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""}`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${metric.tone}`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold tracking-tight text-slate-950">
                      {metric.value}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {metric.label}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-400">
                    {metric.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Stack>
    </div>
  );
}

