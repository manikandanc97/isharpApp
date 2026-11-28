"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BookCheck,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  Info,
  Play,
  Search,
  ShieldCheck,
  X,
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
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMock, setSelectedMock] = useState<
    StudentPortalData["mockTests"][number] | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const categories = useMemo(() => {
    const names = new Set<string>();
    for (const m of data.mockTests) {
      if (m.categoryName) names.add(m.categoryName);
    }
    return Array.from(names);
  }, [data.mockTests]);

  const filteredMocks = useMemo(() => {
    return data.mockTests.filter((m) => {
      if (selectedCategory !== "ALL" && m.categoryName !== selectedCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        (m.categoryName?.toLowerCase().includes(q) ?? false) ||
        (m.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.mockTests, selectedCategory, searchQuery]);

  const handleOpenInstructions = (
    mock: StudentPortalData["mockTests"][number],
  ) => {
    setSelectedMock(mock);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header & Category Filter */}
      <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Test Series &amp; Mock Tests
            </h2>
            <p className="mt-1 max-w-xl text-xs text-slate-600">
              Browse tests by category and take NEET examinations with bilingual
              English and Tamil support.
            </p>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                selectedCategory === "ALL"
                  ? "bg-brand-blue text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              All Categories ({data.mockTests.length})
            </button>
            {categories.map((cat) => {
              const count = data.mockTests.filter(
                (m) => m.categoryName === cat,
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? "bg-brand-blue text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests by name or category..."
            className="h-10 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-9 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/10 sm:text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-600 focus:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredMocks.length ? (
          filteredMocks.map((mock) => {
            const isCompleted =
              mock.availabilityStatus === "COMPLETED" && Boolean(mock.latestResult);
            const isUpcoming = mock.availabilityStatus === "UPCOMING";
            const isExpired = mock.availabilityStatus === "EXPIRED";

            return (
              <article
                key={mock.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs transition-all hover:border-slate-300 hover:shadow-card"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {mock.categoryName && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                          {mock.categoryName}
                        </span>
                      )}
                      <span className="rounded-md bg-brand-red/10 px-2.5 py-0.5 font-mono text-xs font-bold text-brand-red">
                        {mock.code}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          mock.activeAttemptId
                            ? "border-amber-200 bg-amber-50 text-amber-800 text-3xs font-semibold"
                            : isCompleted
                              ? "border-slate-200 bg-slate-100 text-slate-700 text-3xs font-semibold"
                              : isUpcoming || isExpired
                                ? "border-slate-200 bg-slate-50 text-slate-500 text-3xs font-semibold"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 text-3xs font-semibold"
                        }
                      >
                        {mock.activeAttemptId
                          ? "IN PROGRESS"
                          : mock.availabilityStatus || "LIVE"}
                      </Badge>
                      {mock.scheduledAt && (
                        <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Calendar className="size-3" />
                          {formatDate(mock.scheduledAt)}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {mock.title}
                    </h3>

                    {mock.description && (
                      <p className="max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {mock.description}
                      </p>
                    )}

                    {/* Subjects & Metric Pills */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                      {mock.subjects && mock.subjects.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {mock.subjects.map((sub) => (
                            <span
                              key={sub.code}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                            >
                              {sub.name} ({sub.questionCount})
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <FileQuestion className="size-3.5 text-purple-600" />
                        <span>{mock.questionCount} Questions</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <Clock className="size-3.5 text-brand-blue" />
                        <span>{mock.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 font-medium text-slate-700">
                        <Award className="size-3.5 text-emerald-600" />
                        <span>{mock.totalMarks} Total Marks</span>
                      </div>
                      {mock.latestResult ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
                          <CheckCircle2 className="size-3.5" />
                          <span>
                            Score: {mock.latestResult.score}/
                            {mock.latestResult.maxMarks} (
                            {Math.round(mock.latestResult.percentage)}%)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-3 py-1 text-slate-500">
                          <ShieldCheck className="size-3.5 text-slate-400" />
                          <span>+4 / -1 Marking</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
                    {mock.activeAttemptId ? (
                      <Button
                        onClick={() =>
                          router.push(`/exam/${mock.activeAttemptId}`)
                        }
                        className="cursor-pointer rounded-full bg-amber-600 px-6 py-2.5 text-xs font-semibold text-white shadow-primary transition hover:bg-amber-700 active:scale-95 sm:text-sm"
                      >
                        <Play className="mr-1.5 size-4 fill-white" />
                        <span>Resume Test</span>
                      </Button>
                    ) : isCompleted ? (
                      <Button
                        onClick={() => handleOpenInstructions(mock)}
                        className="cursor-pointer rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-primary transition hover:bg-emerald-700 active:scale-95 sm:text-sm"
                      >
                        <CheckCircle2 className="mr-1.5 size-4" />
                        <span>View Result</span>
                      </Button>
                    ) : (
                      <Button
                        disabled={isUpcoming || isExpired}
                        onClick={() => handleOpenInstructions(mock)}
                        className="cursor-pointer rounded-full bg-brand-red px-6 py-2.5 text-xs font-semibold text-white shadow-primary transition hover:bg-brand-red-hover active:scale-95 disabled:opacity-50 sm:text-sm"
                      >
                        <Play className="mr-1.5 size-4 fill-white" />
                        <span>
                          {isUpcoming
                            ? "Upcoming"
                            : isExpired
                              ? "Expired"
                              : "Start Test"}
                        </span>
                      </Button>
                    )}
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
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookCheck className="mx-auto size-10 text-slate-400" />
            <h3 className="mt-3 text-base font-bold text-slate-800">
              No tests found
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              No active tests match your selected category or search query.
            </p>
          </div>
        )}
      </div>

      {/* Guidelines Modal */}
      <MockInstructionsDialog
        mock={selectedMock}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
