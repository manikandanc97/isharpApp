import { LightSearchBox } from "./admin-helpers";
import type { StudentFilterCategory } from "./student-search-utils";

export interface StudentSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  showingCount: number;
  totalFilteredCount: number;
  studentType: StudentFilterCategory;
  onStudentTypeChange: (type: StudentFilterCategory) => void;
}

const CATEGORIES: StudentFilterCategory[] = ["ALL", "INTERNAL", "EXTERNAL"];

export function StudentSearchBar({
  query,
  onQueryChange,
  showingCount,
  totalFilteredCount,
  studentType,
  onStudentTypeChange,
}: StudentSearchBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LightSearchBox
          value={query}
          onChange={onQueryChange}
          placeholder="Search name or student ID…"
        />
        <span className="text-xs font-semibold text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-800">
            {showingCount}
          </span>{" "}
          of {totalFilteredCount} students
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onStudentTypeChange(type)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              studentType === type
                ? "border-brand-blue bg-brand-blue text-white shadow-xs"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-brand-blue"
            }`}
          >
            {type === "ALL"
              ? "All students"
              : type === "INTERNAL"
                ? "Internal"
                : "External"}
          </button>
        ))}
      </div>
    </div>
  );
}
