"use client";

import { useState } from "react";
import { request } from "./helpers";
import { emptyDraft, type Draft, type Question } from "./types";
import type { SubjectFilter } from "./use-question-bank-filters";

export interface UseQuestionDraftEditorOptions {
  subjectFilter: SubjectFilter;
  setSubjectFilter: (sub: SubjectFilter) => void;
  onQuestionsChanged: () => Promise<void> | void;
  setBusy: (busy: boolean) => void;
  setError: (err: string) => void;
  setNotice: (notice: string) => void;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useQuestionDraftEditor({
  subjectFilter,
  setSubjectFilter,
  onQuestionsChanged,
  setBusy,
  setError,
  setNotice,
  setQuestions,
  setSelected,
}: UseQuestionDraftEditorOptions) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const patchOption = (
    index: number,
    patch: Partial<Draft["options"][number]>,
  ) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...patch } : option,
      ),
    }));

  const chooseCorrect = (index: number) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => ({
        ...option,
        isCorrect:
          current.type === "MULTIPLE_CORRECT"
            ? optionIndex === index
              ? !option.isCorrect
              : option.isCorrect
            : optionIndex === index,
      })),
    }));

  const uploadImage = async (file: File, apply: (url: string) => void) => {
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch("/api/admin/question-media", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        url?: string;
        message?: string;
      };
      if (!response.ok || !payload.url)
        throw new Error(payload.message || "Upload failed");
      apply(payload.url);
      setNotice("Image uploaded securely.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request("questions", {
        method: "POST",
        body: JSON.stringify({
          ...draft,
          courseCode: "NEET",
          subjectCode: subjectFilter,
          correctMarks: 4,
          negativeMarks: 1,
        }),
      });
      setDraft({
        ...emptyDraft(),
        courseCode: "NEET",
        subjectCode: subjectFilter,
      });
      setEditingId(null);
      setEditorOpen(false);
      setNotice(
        editingId
          ? "Question updated successfully."
          : "Question added successfully.",
      );
      await onQuestionsChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Question save failed");
    } finally {
      setBusy(false);
    }
  };

  const editQuestion = (question: Question) => {
    const legacy = ["A", "B", "C", "D"];
    const options = ["1", "2", "3", "4"].map((label, idx) => {
      const existing = question.options.find(
        (item) =>
          item.label === label ||
          item.label === legacy[idx] ||
          (item as unknown as { position?: number }).position === idx + 1,
      );
      return {
        label,
        textEn: existing?.textEn ?? "",
        textTa: existing?.textTa ?? "",
        imageUrl: existing?.imageUrl ?? "",
        isCorrect: existing?.isCorrect ?? false,
      };
    });
    setSubjectFilter(
      question.courseSubject.subject.code as SubjectFilter,
    );
    setEditingId(question.id);
    setDraft({
      externalId: question.externalId,
      courseCode: question.courseSubject.course.code,
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options,
    });
    setEditorOpen(true);
  };

  const createQuestion = () => {
    setEditingId(null);
    setDraft({
      ...emptyDraft(),
      courseCode: "NEET",
      subjectCode: subjectFilter,
    });
    setEditorOpen(true);
  };

  const applyDemoQuestion = (question: Question) => {
    const fresh = emptyDraft();
    setSubjectFilter(
      question.courseSubject.subject.code as SubjectFilter,
    );
    setEditingId(null);
    setDraft({
      externalId: fresh.externalId,
      courseCode: "NEET",
      subjectCode: question.courseSubject.subject.code,
      chapterTitle: question.chapter?.title ?? "",
      type: question.type,
      language: question.language,
      difficulty: question.difficulty,
      textEn: question.textEn ?? "",
      textTa: question.textTa ?? "",
      questionImageUrl: question.questionImageUrl ?? "",
      solutionEn: question.solutionEn ?? "",
      solutionTa: question.solutionTa ?? "",
      solutionImageUrl: question.solutionImageUrl ?? "",
      numericalAnswer: question.numericalAnswer ?? "",
      source: question.source ?? "",
      options: ["1", "2", "3", "4"].map((label, idx) => {
        const legacy = ["A", "B", "C", "D"];
        const option = question.options.find(
          (item) =>
            item.label === label ||
            item.label === legacy[idx] ||
            (item as unknown as { position?: number }).position === idx + 1,
        );
        return {
          label,
          textEn: option?.textEn ?? "",
          textTa: option?.textTa ?? "",
          imageUrl: option?.imageUrl ?? "",
          isCorrect: option?.isCorrect ?? false,
        };
      }),
    });
    setEditorOpen(true);
  };

  const deleteQuestion = async (question: Question) => {
    setBusy(true);
    try {
      await request(`questions/${question.id}`, { method: "DELETE" });
      setQuestions((current) =>
        current.filter((item) => item.id !== question.id),
      );
      setSelected((current) => current.filter((id) => id !== question.id));
      setNotice("Question deleted.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Question delete failed",
      );
    } finally {
      setBusy(false);
    }
  };

  const bulkDeleteQuestions = async (toDelete: Question[]) => {
    if (!toDelete.length) return;
    setBusy(true);
    const toDeleteIds = new Set(toDelete.map((q) => q.id));
    let deletedCount = 0;
    try {
      const BATCH_SIZE = 5;
      for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (q) => {
            await request(`questions/${q.id}`, { method: "DELETE" });
            deletedCount += 1;
          }),
        );
      }
      setQuestions((current) =>
        current.filter((item) => !toDeleteIds.has(item.id)),
      );
      setSelected((current) =>
        current.filter((id) => !toDeleteIds.has(id)),
      );
      setNotice(`${deletedCount} question${deletedCount > 1 ? "s" : ""} deleted.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : `Failed deleting questions (${deletedCount}/${toDelete.length} completed)`,
      );
    } finally {
      setBusy(false);
    }
  };

  return {
    draft,
    setDraft,
    editingId,
    setEditingId,
    editorOpen,
    setEditorOpen,
    patchOption,
    chooseCorrect,
    uploadImage,
    save,
    editQuestion,
    createQuestion,
    applyDemoQuestion,
    deleteQuestion,
    bulkDeleteQuestions,
  };
}
