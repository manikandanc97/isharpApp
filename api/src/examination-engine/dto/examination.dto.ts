export interface StartAttemptDto {
  testId: string;
}

export interface AutosaveAnswerDto {
  questionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: string | null;
  isMarkedForReview?: boolean;
  isVisited?: boolean;
  timeSpentSeconds?: number;
}

export interface SubmitAttemptDto {
  timeSpentSeconds?: number;
}

export interface AnswerKeyAuditDto {
  questionId: string;
  newKey: string;
  changeType: 'ANSWER_CHANGE' | 'QUESTION_DROPPED' | 'MULTIPLE_CORRECT';
  reason: string;
}
