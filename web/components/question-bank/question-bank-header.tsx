"use client";

import Link from "next/link";
import {
  Download,
  FileDown,
  FileQuestion,
  FileSpreadsheet,
  Layers,
  Plus,
  Target,
} from "lucide-react";

import { Stack } from "@/components/layout/layout-primitives";

interface QuestionBankHeaderProps {
  questionsCount: number;
  selectedCount: number;
  onCreateQuestion: () => void;
  onOpenImport: () => void;
  onExportExcel?: () => void;
}

export function QuestionBankHeader({
  questionsCount,
  selectedCount,
  onCreateQuestion,
  onOpenImport,
  onExportExcel,
}: QuestionBankHeaderProps) {
  const metrics = [
    {
      label: "Total Questions",
      detail: "Indexed in Repository",
      value: questionsCount,
      icon: FileQuestion,
      tone: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Active Subjects",
      detail: "Physics · Chem · Bio",
      value: 3,
      icon: Layers,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Filtered Questions",
      detail: "Active View Count",
      value: selectedCount,
      icon: Target,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-[#fbfbfa] px-5 py-5 sm:px-7 sm:py-6">
      <Stack gap="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-3xs font-semibold uppercase tracking-wider text-indigo-600">
              NEET Question Repository
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Question Bank
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Manage bilingual Tamil &amp; English questions, chapter tagging &amp; Excel imports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onCreateQuestion}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-navy px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-navy/90 active:scale-95"
            >
              <Plus className="size-4" /> Add Question
            </button>

            <div className="hidden h-5 w-px bg-slate-200 sm:block" />

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/api/admin/questions/template"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-95"
                title="Download Excel Template"
              >
                <FileDown className="size-3.5 text-slate-500" /> Template
              </Link>
              <button
                type="button"
                onClick={onOpenImport}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-95"
                title="Import Questions via Excel"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-600" /> Import Excel
              </button>
              {onExportExcel && (
                <button
                  type="button"
                  onClick={onExportExcel}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-95"
                  title="Export Questions to Excel"
                >
                  <Download className="size-3.5 text-indigo-600" /> Export Excel
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`flex items-center gap-4 px-5 py-4 ${
                  index ? "border-t border-slate-100 sm:border-l sm:border-t-0" : ""
                }`}
              >
                <div className={`grid size-11 place-items-center rounded-xl ${metric.tone}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[26px]">
                    {metric.value}
                  </p>
                  <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
                    {metric.label} · {metric.detail}
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
