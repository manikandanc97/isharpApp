"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Upload } from "lucide-react";
import type { ImportProgress } from "../types";

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 2 : 3)} MB`;
}

export function AnimatedCount({
  value,
  duration = 350,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevRef.current = value;
      const id = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(id);
    }
    const fromVal = prevRef.current;
    const toVal = value;
    prevRef.current = value;
    if (fromVal === toVal) return;

    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromVal + (toVal - fromVal) * eased);
      setDisplay(current);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}

export function ImportProgressPanel({
  fileName,
  importProgress,
}: {
  fileName?: string;
  importProgress: ImportProgress;
}) {
  const wizardSteps = [
    {
      step: "1",
      label: "Upload",
      done: importProgress.phase !== "uploading",
      active: importProgress.phase === "uploading",
    },
    {
      step: "2",
      label: "Validate & de-duplicate",
      done:
        importProgress.stage === "persisting" ||
        importProgress.stage === "complete",
      active:
        importProgress.phase === "processing" &&
        (importProgress.stage === "parsing" ||
          importProgress.stage === "deduplicating" ||
          importProgress.stage === "images"),
    },
    {
      step: "3",
      label: "Save & summarize",
      done: importProgress.stage === "complete",
      active: importProgress.stage === "persisting",
    },
  ];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md animate-in fade-in-0 zoom-in-95 duration-300"
      aria-live="polite"
    >
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-5 py-5 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_top_right,#38bdf8,transparent_50%)]" />
        <div className="relative flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 shadow-inner ring-1 ring-white/15">
            {importProgress.phase === "uploading" ? (
              <Upload className="size-5 animate-pulse text-sky-400" />
            ) : (
              <LoaderCircle className="size-5 animate-spin text-sky-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <p className="text-sm font-bold tracking-tight text-white">
                    {importProgress.phase === "uploading"
                      ? "Uploading workbook"
                      : "Validating & importing questions"}
                  </p>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-slate-400">
                  {fileName}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-black tabular-nums tracking-tight text-white">
                  {importProgress.phase === "uploading" ? (
                    <>
                      <AnimatedCount value={importProgress.percent} />%
                    </>
                  ) : importProgress.totalRows > 0 ? (
                    <>
                      <AnimatedCount value={importProgress.processedRows} />
                      <span className="ml-1 text-xs font-medium text-slate-400">
                        / {importProgress.totalRows.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="flex items-center justify-end gap-1.5 text-sm font-semibold text-sky-400">
                      <LoaderCircle className="size-3.5 animate-spin" />{" "}
                      Initializing
                    </span>
                  )}
                </div>
                {importProgress.phase === "processing" &&
                  importProgress.totalRows > 0 && (
                    <p className="text-[11px] font-semibold tabular-nums text-sky-400">
                      <AnimatedCount value={importProgress.percent} />%
                      completed
                    </p>
                  )}
              </div>
            </div>

            <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-slate-800/90 p-0.5 ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 shadow-sm shadow-sky-500/50 transition-[width] duration-300 ease-out"
                style={{ width: `${Math.max(2, importProgress.percent)}%` }}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <span className="inline-block size-1.5 animate-pulse rounded-full bg-sky-400" />
                {importProgress.stageMessage ||
                  (importProgress.phase === "uploading"
                    ? `${formatBytes(importProgress.loadedBytes)} of ${formatBytes(importProgress.totalBytes)}`
                    : "Checking duplicates, validating rows and saving records...")}
              </span>
              <span className="text-[11px] text-slate-400">
                Live stream ingestion · Do not close
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-3">
        {wizardSteps.map(({ step, label, done, active }) => (
          <div
            key={label}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              active ? "bg-sky-50/80" : "bg-slate-50/60"
            }`}
          >
            <span
              className={`grid size-7 place-items-center rounded-full text-xs font-bold transition-all ${
                done
                  ? "bg-emerald-500 text-white shadow-xs"
                  : active
                    ? "bg-sky-600 text-white shadow-xs ring-4 ring-sky-100"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <CheckCircle2 className="size-4" /> : step}
            </span>
            <span
              className={`block truncate text-xs font-semibold ${
                active
                  ? "font-bold text-sky-950"
                  : done
                    ? "text-slate-800"
                    : "text-slate-500"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-4"
        aria-label="Live import counts"
      >
        <div className="bg-white px-4 py-3.5 text-center transition-all">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <span className="size-2 rounded-full bg-slate-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Processed
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tight text-slate-950">
            <AnimatedCount value={importProgress.processedRows} />
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {importProgress.totalRows > 0
              ? `of ${importProgress.totalRows.toLocaleString()} rows`
              : "Total rows"}
          </p>
        </div>

        <div className="bg-white px-4 py-3.5 text-center transition-all">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Imported
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tight text-emerald-600">
            <AnimatedCount value={importProgress.importedRows} />
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-600/80">
            New questions
          </p>
        </div>

        <div className="bg-white px-4 py-3.5 text-center transition-all">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
              Duplicates
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tight text-amber-600">
            <AnimatedCount value={importProgress.skippedRows} />
          </p>
          <p className="mt-0.5 text-[10px] text-amber-600/80">
            Safely skipped
          </p>
        </div>

        <div className="bg-white px-4 py-3.5 text-center transition-all">
          <div className="mb-1 flex items-center justify-center gap-1.5">
            <span className="size-2 rounded-full bg-rose-500" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">
              Errors
            </p>
          </div>
          <p className="text-2xl font-black tabular-nums tracking-tight text-rose-600">
            <AnimatedCount value={importProgress.failedRows} />
          </p>
          <p className="mt-0.5 text-[10px] text-rose-600/80">Failed rows</p>
        </div>
      </div>
    </div>
  );
}
