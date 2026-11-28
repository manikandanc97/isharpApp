"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SubjectWithChapters } from "../types";

interface TestsTableFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  subjectFilter: string;
  onSubjectFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  uniqueSubjects: SubjectWithChapters[];
}

export function TestsTableFilters({
  search,
  onSearchChange,
  subjectFilter,
  onSubjectFilterChange,
  statusFilter,
  onStatusFilterChange,
  uniqueSubjects,
}: TestsTableFiltersProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2.5 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tests..."
          className="h-8 bg-white pl-8 pr-7 text-xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Select
          value={subjectFilter}
          onValueChange={(val) => val && onSubjectFilterChange(val)}
        >
          <SelectTrigger className="h-8 w-32 cursor-pointer bg-white text-xs">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="cursor-pointer">
              All Subjects
            </SelectItem>
            {uniqueSubjects.map((s) => (
              <SelectItem
                key={s.subjectCode}
                value={s.subjectCode}
                className="cursor-pointer"
              >
                {s.subjectName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(val) => val && onStatusFilterChange(val)}
        >
          <SelectTrigger className="h-8 w-28 cursor-pointer bg-white text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="cursor-pointer">
              All Status
            </SelectItem>
            <SelectItem value="ACTIVE" className="cursor-pointer">
              Active
            </SelectItem>
            <SelectItem value="INACTIVE" className="cursor-pointer">
              Inactive
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
