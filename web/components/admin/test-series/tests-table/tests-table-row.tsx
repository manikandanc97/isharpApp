"use client";

import {
  AlertTriangle,
  Eye,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CategoryTestItem } from "../types";

interface TestsTableRowProps {
  test: CategoryTestItem;
  isSelected: boolean;
  onSelect: () => void;
  onRename: () => void;
  onPreview: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

export function TestsTableRow({
  test,
  isSelected,
  onSelect,
  onRename,
  onPreview,
  onToggleActive,
  onDelete,
}: TestsTableRowProps) {
  const hasWarning = test.isConfigurationValid === false;

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer transition ${
        isSelected
          ? "border-l-2 border-l-brand-blue bg-blue-50/50"
          : "hover:bg-slate-50/80"
      }`}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="line-clamp-1 font-semibold text-slate-900">
            {test.title}
          </span>
          {hasWarning && (
            <span
              title={
                test.configurationWarnings?.join(" ") ??
                "Incomplete configuration"
              }
            >
              <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] text-slate-400">
            {test.code}
          </span>
          {test.subjectsSummary.length > 0 ? (
            <div
              className="flex flex-wrap items-center gap-1"
              title={test.subjectsSummary
                .map((s) => `${s.subjectName}: ${s.count}`)
                .join(", ")}
            >
              {test.subjectsSummary.slice(0, 3).map((s) => (
                <span
                  key={s.subjectCode}
                  className="inline-flex items-center rounded-md border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                >
                  {s.subjectName.slice(0, 3)} {s.count}
                </span>
              ))}
              {test.subjectsSummary.length > 3 && (
                <span className="text-[10px] text-slate-400">
                  +{test.subjectsSummary.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-medium text-amber-600">
              Unconfigured
            </span>
          )}
          {test.attemptCount > 0 && (
            <span className="text-[10px] font-medium text-amber-600">
              • {test.attemptCount} attempt{test.attemptCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-3 text-right">
        <div
          className={`font-semibold ${
            test.assignedQuestionCount === test.totalQuestions
              ? "text-slate-800"
              : "text-amber-700"
          }`}
        >
          {test.assignedQuestionCount}/{test.totalQuestions} Qns
        </div>
        <div className="mt-0.5 text-[11px] text-slate-500">
          {test.durationMinutes}m • {test.totalMarks} marks
        </div>
      </td>

      <td className="px-3 py-3">
        <Badge
          variant="outline"
          className={
            test.isActive
              ? "gap-1.5 border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
              : "gap-1.5 border-slate-200 bg-slate-100 text-[10px] text-slate-600"
          }
        >
          <span
            className={`size-1.5 rounded-full ${
              test.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {test.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>

      <td
        className="px-3 py-3 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 cursor-pointer rounded-lg text-slate-500 hover:text-slate-900"
              />
            }
          >
            <MoreVertical className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="cursor-pointer" onClick={onSelect}>
              <Pencil className="mr-2 size-3.5" />
              Edit Test
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onRename}>
              <Pencil className="mr-2 size-3.5" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={onPreview}>
              <Eye className="mr-2 size-3.5" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={onToggleActive}
            >
              <Power className="mr-2 size-3.5" />
              {test.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 size-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
