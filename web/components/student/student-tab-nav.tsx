"use client";

import {
  BarChart3,
  BookCheck,
  BookOpen,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TabId } from "./student-types";

function LayoutTabIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </svg>
  );
}

const TABS = [
  { id: "overview" as const, label: "Overview & Daily Plan", icon: LayoutTabIcon },
  { id: "dpp" as const, label: "Daily DPP Drills (15 Qs)", icon: Zap },
  { id: "mocks" as const, label: "Mock Test Arena (720M)", icon: BookCheck },
  { id: "subjects" as const, label: "Curriculum & Subjects", icon: BookOpen },
  { id: "analytics" as const, label: "Analytics & Rank", icon: BarChart3 },
];

interface StudentTabNavProps {
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function StudentTabNav({ activeTab, onTabChange }: StudentTabNavProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
      <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-150",
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5",
                  isActive ? "text-white" : "text-slate-500",
                )}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

