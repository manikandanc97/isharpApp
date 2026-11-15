import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StudentDppEmptyStateProps {
  onResetFilters: () => void;
}

export function StudentDppEmptyState({ onResetFilters }: StudentDppEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <FileQuestion className="mx-auto size-10 text-slate-400" />
      <h3 className="mt-3 text-base font-bold text-slate-800">
        No questions match your current filters
      </h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
        Try adjusting your search keywords, selected subject, or difficulty level to see more practice problems.
      </p>
      <Button
        onClick={onResetFilters}
        className="mt-4 rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover"
      >
        Clear Filters
      </Button>
    </div>
  );
}
