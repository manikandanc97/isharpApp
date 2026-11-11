"use client";

import {
  BarChart3,
  BookCheck,
  BookOpen,
  FileQuestion,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId } from "./student-types";

interface StudentTabNavProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  counts?: {
    dpp?: number;
    mocks?: number;
    subjects?: number;
  };
}

export function StudentTabNav({
  activeTab,
  onTabChange,
  counts,
}: StudentTabNavProps) {
  const tabs = [
    {
      id: "overview" as const,
      label: "Overview",
      icon: LayoutGrid,
      count: undefined,
    },
    {
      id: "dpp" as const,
      label: "Question Bank",
      icon: FileQuestion,
      count: counts?.dpp,
    },
    {
      id: "mocks" as const,
      label: "Mock Tests",
      icon: BookCheck,
      count: counts?.mocks,
    },
    {
      id: "subjects" as const,
      label: "Curriculum & Syllabus",
      icon: BookOpen,
      count: counts?.subjects,
    },
    {
      id: "analytics" as const,
      label: "Learning Activity",
      icon: BarChart3,
      count: undefined,
    },
  ];

  return (
    <div className="relative border-b border-slate-200/90 pb-3">
      <nav
        role="tablist"
        aria-label="Student portal navigation"
        className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none",
                isActive
                  ? "bg-brand-blue text-white shadow-secondary"
                  : "bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 sm:size-4 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600",
                )}
              />
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={cn(
                    "ml-0.5 rounded-full px-1.5 py-0.2 text-3xs font-bold transition",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
