import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "../student-helpers";
import type { StudentPortalData, TabId } from "../student-types";

export interface StudentUpcomingMockCardProps {
  upcomingMock: StudentPortalData["mockTests"][number] | null;
  totalMocksCount: number;
  onTabChange: (tab: TabId) => void;
  onOpenMockDetails?: (mock: StudentPortalData["mockTests"][number]) => void;
}

export function StudentUpcomingMockCard({
  upcomingMock,
  totalMocksCount,
  onTabChange,
  onOpenMockDetails,
}: StudentUpcomingMockCardProps) {
  return (
    <section className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xs">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Assessment Series</h2>
              <p className="text-xs text-slate-500">Timed full-length exam simulations</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTabChange("mocks")}
            className="rounded-full text-xs font-semibold text-brand-red hover:bg-rose-50 cursor-pointer"
          >
            View all ({totalMocksCount})
          </Button>
        </div>

        {upcomingMock ? (
          <div className="mt-5 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-brand-red">
                {upcomingMock.code}
              </span>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 text-3xs font-semibold">
                AVAILABLE FOR PRACTICE
              </Badge>
            </div>
            <h3 className="mt-2 text-base font-bold text-slate-900">
              {upcomingMock.title}
            </h3>
            {upcomingMock.description && (
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                {upcomingMock.description}
              </p>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-xs">
              <div>
                <span className="text-slate-400 text-3xs uppercase font-medium">Duration</span>
                <p className="font-semibold text-slate-800">{upcomingMock.durationMinutes} mins</p>
              </div>
              <div>
                <span className="text-slate-400 text-3xs uppercase font-medium">Marks</span>
                <p className="font-semibold text-emerald-600">{upcomingMock.totalMarks} pts</p>
              </div>
              <div>
                <span className="text-slate-400 text-3xs uppercase font-medium">Questions</span>
                <p className="font-semibold text-slate-800">{upcomingMock.questionCount} Qs</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Scheduled: <strong className="text-slate-700">{formatDate(upcomingMock.scheduledAt)}</strong>
              </span>
              {onOpenMockDetails ? (
                <Button
                  size="sm"
                  onClick={() => onOpenMockDetails(upcomingMock)}
                  className="rounded-full bg-brand-blue text-xs font-semibold text-white hover:bg-brand-blue-hover cursor-pointer"
                >
                  <span>Test Rules</span>
                  <ArrowRight className="ml-1 size-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onTabChange("mocks")}
                  className="rounded-full bg-brand-red text-xs font-semibold text-white hover:bg-brand-red-hover cursor-pointer"
                >
                  <span>Take Test</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <Calendar className="mx-auto size-7 text-slate-400" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No mock tests currently scheduled</p>
            <p className="mt-1 text-xs text-slate-500">New academy assessment papers will appear here automatically.</p>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900 flex items-center gap-2">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        <span>Mock test attempts simulate the exact NTA exam pattern with negative marking.</span>
      </div>
    </section>
  );
}
