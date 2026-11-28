"use client";

import { useMemo, useState } from "react";
import { BookOpen, Plus } from "lucide-react";
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
import { ChapterTableHeader } from "./chapter-table-header";
import { ChapterTableRow } from "./chapter-table-row";

interface ChapterTableProps {
  subject: CurriculumSubject | null;
  chapters: CurriculumChapter[];
  onAddChapter: (subjectId: string, data: ChapterFormData) => void;
  onEditChapter: (chapterId: string, data: Partial<ChapterFormData>) => void;
  onToggleActive: (chapterId: string) => void;
  onReorder: (chapterId: string, direction: "up" | "down") => void;
  onDeleteChapter: (chapterId: string) => void;
  onAddTopic: (
    chapterId: string,
    data: { title: string; position?: number },
  ) => void;
  onEditTopic: (
    chapterId: string,
    topicId: string,
    data: { title?: string },
  ) => void;
  onDeleteTopic: (chapterId: string, topicId: string) => void;
  onReorderTopic: (
    chapterId: string,
    topicId: string,
    direction: "up" | "down",
  ) => void;
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
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filterKey = `${query}|${statusFilter}|${subject?.id ?? ""}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] =
    useState<CurriculumChapter | null>(null);
  const [deletingChapter, setDeletingChapter] =
    useState<CurriculumChapter | null>(null);
  const [activeTopicChapter, setActiveTopicChapter] =
    useState<CurriculumChapter | null>(null);

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
          (ch.description && ch.description.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [chapters, statusFilter, query]);

  const totalPages = Math.max(1, Math.ceil(filteredChapters.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedChapters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredChapters.slice(start, start + pageSize);
  }, [filteredChapters, currentPage, pageSize]);

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
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `isharp-${subject.code.toLowerCase()}-chapters-export.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12">
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

  const currentTopicChapter = activeTopicChapter
    ? chapters.find((ch) => ch.id === activeTopicChapter.id) || null
    : null;

  return (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <ChapterTableHeader
        subject={subject}
        chapters={chapters}
        query={query}
        statusFilter={statusFilter}
        onQueryChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        onStatusFilterChange={(f) => {
          setStatusFilter(f);
          setPage(1);
        }}
        onExportCSV={handleExportCSV}
        onOpenAddDialog={() => setAddDialogOpen(true)}
      />

      <div className="min-h-[420px] overflow-x-auto">
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
                <ChapterTableRow
                  key={chapter.id}
                  chapter={chapter}
                  isFirst={globalIndex === 0}
                  isLast={globalIndex === chapters.length - 1}
                  onInspectTopics={() => setActiveTopicChapter(chapter)}
                  onEdit={() => setEditingChapter(chapter)}
                  onToggleActive={() => onToggleActive(chapter.id)}
                  onReorder={(dir) => onReorder(chapter.id, dir)}
                  onDelete={() => setDeletingChapter(chapter)}
                />
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
                    <p className="max-w-sm text-3xs text-slate-400">
                      {query
                        ? `No chapters matched your search query "${query}".`
                        : `No chapters indexed under ${subject.name} yet.`}
                    </p>
                    {!query && (
                      <Button
                        size="sm"
                        onClick={() => setAddDialogOpen(true)}
                        className="mt-2 rounded-full bg-brand-navy text-xs text-white"
                      >
                        <Plus className="mr-1 size-3.5" />
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
