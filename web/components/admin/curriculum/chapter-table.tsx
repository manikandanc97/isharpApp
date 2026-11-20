"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Layers,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/admin/admin-helpers";
import type {
  ChapterFormData,
  CurriculumChapter,
  CurriculumSubject,
} from "./curriculum-types";
import { ChapterDialog } from "./chapter-dialog";
import { ChapterDeleteDialog } from "./chapter-delete-dialog";
import { TopicManagementDialog } from "./topic-management-dialog";

interface ChapterTableProps {
  subject: CurriculumSubject | null;
  chapters: CurriculumChapter[];
  onAddChapter: (subjectId: string, data: ChapterFormData) => void;
  onEditChapter: (chapterId: string, data: Partial<ChapterFormData>) => void;
  onToggleActive: (chapterId: string) => void;
  onReorder: (chapterId: string, direction: "up" | "down") => void;
  onDeleteChapter: (chapterId: string) => void;
  // Topic methods
  onAddTopic: (chapterId: string, data: { title: string; position?: number }) => void;
  onEditTopic: (chapterId: string, topicId: string, data: { title?: string }) => void;
  onDeleteTopic: (chapterId: string, topicId: string) => void;
  onReorderTopic: (chapterId: string, topicId: string, direction: "up" | "down") => void;
}

export function ChapterTable({
  subject,
  chapters,
  onAddChapter,
  onEditChapter,
  onToggleActive,
  onReorder,
  onDeleteChapter,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onReorderTopic,
}: ChapterTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when subject, filter, or query changes
  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, subject?.id]);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<CurriculumChapter | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<CurriculumChapter | null>(null);
  const [activeTopicChapter, setActiveTopicChapter] = useState<CurriculumChapter | null>(null);

  // Filtered chapters
  const filteredChapters = useMemo(() => {
    let result = chapters;

    if (statusFilter === "ACTIVE") {
      result = result.filter((ch) => ch.isActive);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter((ch) => !ch.isActive);
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (ch) =>
          ch.title.toLowerCase().includes(q) ||
          String(ch.position).includes(q) ||
          (ch.description && ch.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [chapters, statusFilter, query]);

  // Paginated chapters (10 items per page)
  const totalPages = Math.max(1, Math.ceil(filteredChapters.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChapters.slice(start, start + pageSize);
  }, [filteredChapters, currentPage, pageSize]);

  // Handle export to CSV
  const handleExportCSV = () => {
    if (!subject || chapters.length === 0) return;

    const headers = [
      "Chapter Number",
      "Chapter Title",
      "Subject",
      "Topics Count",
      "Status",
      "Description",
    ];

    const rows = chapters.map((ch) => [
      String(ch.position),
      `"${ch.title.replace(/"/g, '""')}"`,
      subject.name,
      String(ch.topics.length),
      ch.isActive ? "Active" : "Inactive",
      `"${(ch.description || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `isharp-${subject.code.toLowerCase()}-chapters-export.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-slate-200 bg-white">
        <BookOpen className="size-8 text-slate-300" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          No Subject Selected
        </p>
        <p className="text-xs text-slate-400">
          Please select a subject from the right curriculum panel.
        </p>
      </div>
    );
  }

  // Find fresh active topic chapter reference from state
  const currentTopicChapter = activeTopicChapter
    ? chapters.find((ch) => ch.id === activeTopicChapter.id) || null
    : null;

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {/* Top Header & Search Bar */}
      <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-indigo-700">
                {subject.code}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {chapters.length} Total Chapters
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-emerald-700 font-medium">
                {chapters.filter((c) => c.isActive).length} Active
              </span>
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {subject.name} Chapters Directory
            </h2>
            <p className="text-xs text-slate-500 line-clamp-1">
              {subject.description || `Manage ${subject.name} curriculum chapters, ordering, and syllabus topics.`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 active:scale-95 cursor-pointer"
              title="Export Chapters to CSV"
            >
              <Download className="size-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-navy px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-navy/90 active:scale-95 cursor-pointer"
            >
              <Plus className="size-4" />
              <span>Add Chapter</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search chapter title, number, or keywords..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs text-slate-900 outline-none transition placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            {(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={`rounded-lg px-2.5 py-1 text-3xs font-bold uppercase tracking-wider transition ${
                  statusFilter === filter
                    ? "bg-white text-indigo-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {filter === "ALL" ? "All" : filter === "ACTIVE" ? "Active" : "Archived"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chapters Table */}
      <div className="overflow-x-auto min-h-[420px]">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 text-3xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-16 px-5 py-3"># No</th>
              <th className="px-5 py-3">Chapter Title</th>
              <th className="w-36 px-5 py-3 text-center">Topics Count</th>
              <th className="w-32 px-5 py-3">Status</th>
              <th className="w-24 px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedChapters.map((chapter, index) => {
              const globalIndex = (page - 1) * pageSize + index;

              return (
                <tr
                  key={chapter.id}
                  onClick={() => setActiveTopicChapter(chapter)}
                  className="group hover:bg-indigo-50/30 transition cursor-pointer"
                >
                  {/* Position */}
                  <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-400 group-hover:text-indigo-600">
                    {String(chapter.position).padStart(2, "0")}
                  </td>

                  {/* Chapter Name & Details */}
                  <td className="px-5 py-3.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition">
                        {chapter.title}
                      </p>
                      {chapter.description ? (
                        <p className="line-clamp-1 text-3xs text-slate-500">
                          {chapter.description}
                        </p>
                      ) : (
                        <p className="text-3xs text-slate-400">
                          Click row to inspect & configure syllabus topics
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Topics Count */}
                  <td className="px-5 py-3.5 text-center" onClick={(e) => {
                    e.stopPropagation();
                    setActiveTopicChapter(chapter);
                  }}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/60 px-3 py-1 text-3xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                    >
                      <Layers className="size-3" />
                      <span>{chapter.topics.length} Topics</span>
                    </button>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-3xs font-bold tracking-wide ${
                        chapter.isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
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

                  {/* Actions */}
                  <td
                    className="px-5 py-3.5 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          disabled={globalIndex === 0}
                          onClick={() => onReorder(chapter.id, "up")}
                          className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Move Chapter Up"
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          disabled={globalIndex === chapters.length - 1}
                          onClick={() => onReorder(chapter.id, "down")}
                          className="grid size-6 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Move Chapter Down"
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <button
                              type="button"
                              className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            />
                          }
                        >
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => setActiveTopicChapter(chapter)}
                          >
                            <Layers className="size-3.5 mr-2 text-indigo-600" />
                            <span>Manage Topics</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingChapter(chapter)}
                          >
                            <Pencil className="size-3.5 mr-2 text-slate-500" />
                            <span>Edit Chapter</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleActive(chapter.id)}
                          >
                            <Power className="size-3.5 mr-2 text-slate-500" />
                            <span>{chapter.isActive ? "Deactivate" : "Activate"}</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeletingChapter(chapter)}
                          >
                            <Trash2 className="size-3.5 mr-2" />
                            <span>Delete Chapter</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredChapters.length === 0 && (
              <tr>
                <td colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <BookOpen className="size-7 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-700">
                      No chapters found
                    </p>
                    <p className="text-3xs text-slate-400 max-w-sm">
                      {query
                        ? `No chapters matched your search query "${query}".`
                        : `No chapters indexed under ${subject.name} yet.`}
                    </p>
                    {!query && (
                      <Button
                        size="sm"
                        onClick={() => setAddDialogOpen(true)}
                        className="mt-2 rounded-full bg-brand-navy text-white text-xs"
                      >
                        <Plus className="size-3.5 mr-1" />
                        Add First Chapter
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredChapters.length > 0 && (
        <div className="border-t border-slate-200 bg-[#fbfbfa] px-5 py-3.5">
          <TablePagination
            page={currentPage}
            pageSize={pageSize}
            totalItems={filteredChapters.length}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Chapter Dialogs */}
      <ChapterDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        subjectName={subject.name}
        defaultPosition={chapters.length + 1}
        onSave={(data) => onAddChapter(subject.id, data)}
      />

      <ChapterDialog
        open={Boolean(editingChapter)}
        onClose={() => setEditingChapter(null)}
        chapter={editingChapter}
        subjectName={subject.name}
        onSave={(data) => {
          if (editingChapter) onEditChapter(editingChapter.id, data);
        }}
      />

      <ChapterDeleteDialog
        open={Boolean(deletingChapter)}
        onClose={() => setDeletingChapter(null)}
        chapter={deletingChapter}
        onConfirm={onDeleteChapter}
      />

      {/* Dedicated Topic Management View */}
      <TopicManagementDialog
        open={Boolean(currentTopicChapter)}
        onClose={() => setActiveTopicChapter(null)}
        chapter={currentTopicChapter}
        subjectName={subject.name}
        onAddTopic={onAddTopic}
        onEditTopic={onEditTopic}
        onDeleteTopic={onDeleteTopic}
        onReorderTopic={onReorderTopic}
      />
    </section>
  );
}
