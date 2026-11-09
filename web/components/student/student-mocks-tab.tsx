"use client";

import { useMemo, useState } from "react";
import {
  Award,
  BookCheck,
  Clock,
  FileQuestion,
  Info,
  Play,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "./student-helpers";
import { MockInstructionsDialog } from "./student-mock-instructions-dialog";
import type { StudentPortalData } from "./student-types";

interface StudentMocksTabProps {
  data: StudentPortalData;
}

export function StudentMocksTab({ data }: StudentMocksTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMock, setSelectedMock] = useState<StudentPortalData["mockTests"][number] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const filteredMocks = useMemo(() => {
    if (!searchQuery.trim()) return data.mockTests;
    const q = searchQuery.toLowerCase();
    return data.mockTests.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.description?.toLowerCase().includes(q) ?? false)
    );
  }, [data.mockTests, searchQuery]);

  const handleOpenInstructions = (mock: StudentPortalData["mockTests"][number]) => {
    setSelectedMock(mock);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Exam Instructions Hero */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-700">
                OFFICIAL MOCK SERIES
              </span>
              <span className="text-xs text-slate-500">
                Standard NTA Timed Simulations
              </span>
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Published Assessment Papers
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-xl">
              Experience the pressure, pacing, and negative marking of real entrance examinations. All papers feature authentic bilingual questions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-2 text-center text-xs">
              <span className="text-amber-800 font-medium">TOTAL PAPERS</span>
              <p className="font-bold text-amber-900 text-base">{data.mockTests.length} Published</p>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-5 relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mock tests by title, code (e.g. NEET-01)..."
            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/10"
          />
        </div>
      </section>

      {/* Tests Grid */}
      {filteredMocks.length ? (
        <div className="space-y-4">
          {filteredMocks.map((mock) => {
            return (
              <article
                key={mock.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:border-slate-300 hover:shadow-card"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-brand-red/10 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-red">
                        {mock.code}
                      </span>
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 text-3xs font-semibold">
                        ACTIVE TEST PAPER
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        Schedule: <strong className="text-slate-700">{formatDate(mock.scheduledAt)}</strong>
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {mock.title}
                    </h3>

                    {mock.description && (
                      <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-slate-600">
                        {mock.description}
                      </p>
                    )}

                    {/* Metric Pills */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <Clock className="size-3.5 text-brand-blue" />
                        <span>{mock.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <Award className="size-3.5 text-emerald-600" />
                        <span>{mock.totalMarks} Total Marks</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <FileQuestion className="size-3.5 text-purple-600" />
                        <span>{mock.questionCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-slate-500">
                        <ShieldCheck className="size-3.5 text-slate-400" />
                        <span>+4 / -1 Marking Rule</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0 sm:flex-row lg:flex-col lg:items-end">
                    <Button
                      onClick={() => handleOpenInstructions(mock)}
                      className="rounded-full bg-brand-red px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover transition active:scale-95 cursor-pointer"
                    >
                      <Play className="mr-1.5 size-4 fill-white" />
                      <span>Take Test</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenInstructions(mock)}
                      className="rounded-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Info className="mr-1 size-3.5 text-brand-blue" />
                      <span>View Guidelines</span>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookCheck className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            No mock tests found
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No mock tests match your search criteria. Try clearing the search."
              : "No published mock tests are available in the database at the moment."}
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              className="mt-4 rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover"
            >
              Clear Search
            </Button>
          )}
        </div>
      )}

      {/* Guidelines Modal */}
      <MockInstructionsDialog
        mock={selectedMock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
