import { RotateCcw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface StudentDppFilterBarProps {
  practicedCount: number;
  totalQuestions: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSubject: string;
  onSubjectChange: (value: string) => void;
  allSubjects: Array<{ id: string; name: string }>;
  selectedDifficulty: string;
  onDifficultyChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const DIFFICULTIES = ["ALL", "EASY", "MEDIUM", "HARD"] as const;

export function StudentDppFilterBar({
  practicedCount,
  totalQuestions,
  searchQuery,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  allSubjects,
  selectedDifficulty,
  onDifficultyChange,
  selectedType,
  onTypeChange,
  hasActiveFilters,
  onResetFilters,
}: StudentDppFilterBarProps) {
  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xs sm:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-brand-red/10 px-2 py-0.5 text-xs font-bold text-brand-red">
              DPP BANK
            </span>
            <span className="text-xs text-slate-500">
              Daily Practice Problems & Exercises
            </span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Practice Question Bank
          </h2>
        </div>

        {/* Practice Session Counter */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs">
            <span className="text-slate-400">SESSION SOLVED</span>
            <p className="font-bold text-emerald-600">
              {practicedCount} / {totalQuestions} Done
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="mt-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by topic, keyword, question ID (e.g. #Q-001) or chapter..."
            className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-red focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/10"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition focus:outline-none"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Select */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-500">Subject:</span>
              <Select
                value={selectedSubject}
                onValueChange={(value) => value && onSubjectChange(value)}
              >
                <SelectTrigger className="h-8 w-auto min-w-32 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" label="All Subjects">All Subjects</SelectItem>
                  {allSubjects.map((sub) => (
                    <SelectItem key={sub.id} value={sub.name} label={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty Select */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-500">Difficulty:</span>
              <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => onDifficultyChange(diff)}
                    className={`rounded-lg px-2.5 py-1 text-3xs font-bold transition cursor-pointer ${
                      selectedDifficulty === diff
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {diff === "ALL" ? "All" : diff.charAt(0) + diff.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type Select */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-500">Type:</span>
              <Select
                value={selectedType}
                onValueChange={(value) => value && onTypeChange(value)}
              >
                <SelectTrigger className="h-8 w-auto min-w-32 text-xs font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" label="All Types">All Types</SelectItem>
                  <SelectItem value="SINGLE_CORRECT" label="Single Correct">Single Correct</SelectItem>
                  <SelectItem value="MULTIPLE_CORRECT" label="Multiple Correct">Multiple Correct</SelectItem>
                  <SelectItem value="NUMERICAL" label="Numerical">Numerical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
            >
              <RotateCcw className="mr-1 size-3" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
