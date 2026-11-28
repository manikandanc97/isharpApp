import type { QuestionStatus } from "@/components/exam-runner/exam.types";

export interface PaletteSummaryCounts {
  answered: number;
  notAnswered: number;
  marked: number;
  answeredAndMarked: number;
  notVisited: number;
}

export function getQuestionPaletteStatus(record?: {
  visited?: boolean;
  selectedOptionId?: string;
  markedForReview?: boolean;
}): QuestionStatus {
  if (!record || !record.visited) return "not_visited";
  const hasAnswer = Boolean(record.selectedOptionId);
  if (hasAnswer && record.markedForReview) return "answered_and_marked";
  if (record.markedForReview) return "marked_for_review";
  if (hasAnswer) return "answered";
  return "unanswered";
}

export function computePaletteSummaryCounts<T extends { id: string }>(
  questions: T[],
  getStatus: (id: string) => QuestionStatus,
): PaletteSummaryCounts {
  let answered = 0;
  let notAnswered = 0;
  let marked = 0;
  let answeredAndMarked = 0;
  let notVisited = 0;

  questions.forEach((q) => {
    const st = getStatus(q.id);
    if (st === "answered") answered++;
    else if (st === "unanswered") notAnswered++;
    else if (st === "marked_for_review") marked++;
    else if (st === "answered_and_marked") answeredAndMarked++;
    else notVisited++;
  });

  return { answered, notAnswered, marked, answeredAndMarked, notVisited };
}
