"use client";

import {
  ArrowDown,
  ArrowUp,
  Layers,
  MoreVertical,
  Pencil,
  Power,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurriculumChapter } from "./curriculum-types";

interface ChapterTableRowProps {
  chapter: CurriculumChapter;
  isFirst: boolean;
  isLast: boolean;
  onInspectTopics: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onReorder: (direction: "up" | "down") => void;
  onDelete: () => void;
}

export function ChapterTableRow({
  chapter,
  isFirst,
  isLast,
  onInspectTopics,
  onEdit,
  onToggleActive,
  onReorder,
  onDelete,
}: ChapterTableRowProps) {
  return (
    <tr
      onClick={onInspectTopics}
      className="group cursor-pointer transition hover:bg-indigo-50/30"
    >
      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400 group-hover:text-indigo-600">
        {String(chapter.position).padStart(2, "0")}
      </td>

      <td className="px-5 py-3.5">
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900 transition group-hover:text-indigo-700">
            {chapter.title}
          </p>
          {chapter.description ? (
            <p className="line-clamp-1 text-3xs text-slate-500">
              {chapter.description}
            </p>
          ) : (
            <p className="text-3xs text-slate-400">
              Click row to inspect &amp; configure syllabus topics
            </p>
          )}
        </div>
      </td>

      <td
        className="px-5 py-3.5 text-center"
        onClick={(e) => {
          e.stopPropagation();
          onInspectTopics();
        }}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-3xs font-bold text-indigo-700 shadow-2xs transition hover:bg-indigo-100"
        >
          <Layers className="size-3" />
          <span>{chapter.topics.length} Topics</span>
        </button>
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-3xs font-bold tracking-wide ${
            chapter.isActive
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-slate-200 bg-slate-100 text-slate-600"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              chapter.isActive ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {chapter.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </td>

      <td
        className="px-5 py-3.5 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          <div className="flex items-center gap-0.5 opacity-40 transition group-hover:opacity-100">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onReorder("up")}
              className="grid size-6 cursor-pointer place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20"
              title="Move Chapter Up"
            >
              <ArrowUp className="size-3" />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onReorder("down")}
              className="grid size-6 cursor-pointer place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20"
              title="Move Chapter Down"
            >
              <ArrowDown className="size-3" />
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="grid size-7 cursor-pointer place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onInspectTopics}>
                <Layers className="mr-2 size-3.5 text-indigo-600" />
                <span>Manage Topics</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 size-3.5 text-slate-500" />
                <span>Edit Chapter</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                <Power className="mr-2 size-3.5 text-slate-500" />
                <span>{chapter.isActive ? "Deactivate" : "Activate"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-2 size-3.5" />
                <span>Delete Chapter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}
