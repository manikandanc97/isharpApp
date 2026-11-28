"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type {
  CurriculumChapter,
  CurriculumTopic,
  TopicFormData,
} from "./curriculum-types";

interface TopicManagementDialogProps {
  open: boolean;
  onClose: () => void;
  chapter: CurriculumChapter | null;
  subjectName: string;
  onAddTopic: (chapterId: string, data: TopicFormData) => void;
  onEditTopic: (chapterId: string, topicId: string, data: Partial<TopicFormData>) => void;
  onDeleteTopic: (chapterId: string, topicId: string) => void;
  onReorderTopic: (chapterId: string, topicId: string, direction: "up" | "down") => void;
}

export function TopicManagementDialog({
  open,
  onClose,
  chapter,
  subjectName,
  onAddTopic,
  onEditTopic,
  onDeleteTopic,
  onReorderTopic,
}: TopicManagementDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  if (!chapter) return null;

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicTitle.trim()) return;
    onAddTopic(chapter.id, {
      title: newTopicTitle.trim(),
      position: chapter.topics.length + 1,
      isCovered: true,
    });
    setNewTopicTitle("");
    setShowAddForm(false);
  };

  const handleStartEdit = (topic: CurriculumTopic) => {
    setEditingTopicId(topic.id);
    setEditingTitle(topic.title);
  };

  const handleSaveEdit = (topicId: string) => {
    if (!editingTitle.trim()) return;
    onEditTopic(chapter.id, topicId, { title: editingTitle.trim() });
    setEditingTopicId(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-6">
          <div className="flex items-start justify-between gap-3 pr-9 sm:pr-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-3xs font-bold uppercase tracking-wider text-indigo-700">
                  {subjectName}
                </span>
                <span className="text-3xs text-slate-400">·</span>
                <span className="text-3xs font-semibold text-slate-500">
                  Chapter {String(chapter.position).padStart(2, "0")}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-3xs font-semibold ${
                    chapter.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      chapter.isActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  {chapter.isActive ? "Active in Bank" : "Draft"}
                </span>
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {chapter.title}
              </DialogTitle>
              {chapter.description && (
                <p className="text-xs text-slate-500 line-clamp-2">
                  {chapter.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-brand-navy/90 active:scale-95 shrink-0"
            >
              {showAddForm ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              <span>{showAddForm ? "Cancel" : "Add Topic"}</span>
            </button>
          </div>

          {/* Metrics summary */}
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <Layers className="size-3.5 text-indigo-600" />
              <span>
                <strong>{chapter.topics.length}</strong> Curriculum Topics
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>
                <strong>
                  {chapter.topics.filter((t) => t.isCovered).length}
                </strong>{" "}
                Verified for NEET
              </span>
            </div>
          </div>
        </div>

        {/* Inline Add Topic Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateTopic}
            className="border-b border-slate-200 bg-indigo-50/40 p-4 sm:px-6"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Enter topic name (e.g. Carnot Engine, Lens Formula)..."
                value={newTopicTitle}
                onChange={(e) => setNewTopicTitle(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full bg-brand-navy hover:bg-brand-navy/90 text-white text-xs h-9 px-4"
              >
                Save Topic
              </Button>
            </div>
          </form>
        )}

        {/* Topics List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {chapter.topics.map((topic, index) => {
            const isEditing = editingTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 hover:border-indigo-200 hover:shadow-2xs transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-3xs font-bold text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="h-8 flex-1 rounded-lg border border-indigo-400 bg-white px-2.5 text-xs text-slate-900 outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(topic.id);
                          if (e.key === "Escape") setEditingTopicId(null);
                        }}
                      />
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => handleSaveEdit(topic.id)}
                        className="rounded-full bg-indigo-600 text-white"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => setEditingTopicId(null)}
                        className="rounded-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {topic.title}
                      </p>
                      <span className="inline-flex items-center gap-1 text-3xs text-emerald-700">
                        <CheckCircle2 className="size-2.5" />
                        <span>Core Syllabus Covered</span>
                      </span>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Reorder Buttons */}
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onReorderTopic(chapter.id, topic.id, "up")}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="size-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === chapter.topics.length - 1}
                      onClick={() => onReorderTopic(chapter.id, topic.id, "down")}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="size-3" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(topic)}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600 cursor-pointer"
                      title="Edit Topic Name"
                    >
                      <Pencil className="size-3" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => onDeleteTopic(chapter.id, topic.id)}
                      className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                      title="Delete Topic"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {chapter.topics.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <BookOpen className="mx-auto size-6 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-700">
                No topics added yet
              </p>
              <p className="text-3xs text-slate-400">
                Click &quot;Add Topic&quot; above to begin defining the syllabus sub-sections.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <p className="text-3xs text-slate-500">
            Changes to topics save automatically into the academic store.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
