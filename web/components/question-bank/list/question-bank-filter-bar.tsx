"use client";

import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubjectFilter } from "../use-question-bank";

interface QuestionBankFilterBarProps {
  subjectFilter: SubjectFilter;
  query: string;
  onQueryChange: (query: string) => void;
  chapterFilter: string;
  onChapterChange?: (chapter: string) => void;
  difficultyFilter: string;
  onDifficultyChange?: (diff: string) => void;
  typeFilter: string;
  onTypeChange?: (type: string) => void;
  availableChapters: string[];
}

export function QuestionBankFilterBar({
  subjectFilter,
  query,
  onQueryChange,
  chapterFilter,
  onChapterChange,
  difficultyFilter,
  onDifficultyChange,
  typeFilter,
  onTypeChange,
  availableChapters,
}: QuestionBankFilterBarProps) {
  return (
    <div className="grid gap-2.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative sm:col-span-2 lg:col-span-2">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          placeholder={`Search ${subjectFilter.toLowerCase()} by ID, text or Tamil...`}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {onChapterChange && (
        <Select
          value={chapterFilter}
          onValueChange={(value) => value && onChapterChange(value)}
        >
          <SelectTrigger className="h-9 text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="ALL"
              label={`All Chapters (${availableChapters.length})`}
            >
              All Chapters ({availableChapters.length})
            </SelectItem>
            {availableChapters.map((ch) => (
              <SelectItem key={ch} value={ch} label={ch}>
                {ch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {onDifficultyChange && (
        <Select
          value={difficultyFilter}
          onValueChange={(value) => value && onDifficultyChange(value)}
        >
          <SelectTrigger className="h-9 text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All Difficulties">
              All Difficulties
            </SelectItem>
            <SelectItem value="EASY" label="Easy">
              Easy
            </SelectItem>
            <SelectItem value="MEDIUM" label="Medium">
              Medium
            </SelectItem>
            <SelectItem value="HARD" label="Hard">
              Hard
            </SelectItem>
          </SelectContent>
        </Select>
      )}

      {onTypeChange && (
        <Select
          value={typeFilter}
          onValueChange={(value) => value && onTypeChange(value)}
        >
          <SelectTrigger className="h-9 text-xs font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" label="All Question Types">
              All Question Types
            </SelectItem>
            <SelectItem value="SINGLE_CORRECT" label="Single Correct MCQ">
              Single Correct MCQ
            </SelectItem>
            <SelectItem value="MULTIPLE_CORRECT" label="Multiple Correct MCQ">
              Multiple Correct MCQ
            </SelectItem>
            <SelectItem value="NUMERICAL" label="Numerical Questions">
              Numerical Questions
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
