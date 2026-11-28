import { Injectable } from '@nestjs/common';
import {
  DEFAULT_NEET_PATTERN,
  resolvePatternSubjectsForDb,
} from '../exam-pattern.config.js';
import { QuestionSelectionEngine } from '../question-selection.engine.js';

@Injectable()
export class TestConfigurationService {
  constructor(private readonly questionEngine: QuestionSelectionEngine) {}

  async getExamConfiguration() {
    const subjectsAndChapters =
      await this.questionEngine.getSubjectsAndChapters();
    const dbSubjects = subjectsAndChapters.map((s) => ({
      id: s.subjectId,
      code: s.subjectCode,
      name: s.subjectName,
    }));
    const resolvedSubjects = resolvePatternSubjectsForDb(
      dbSubjects,
      DEFAULT_NEET_PATTERN,
    );

    return {
      defaultPattern: {
        ...DEFAULT_NEET_PATTERN,
        resolvedSubjects: resolvedSubjects.map((rs) => {
          const match = subjectsAndChapters.find(
            (s) => s.subjectCode === rs.subjectCode,
          );
          return {
            ...rs,
            courseSubjectId: match?.courseSubjectId ?? null,
            availableQuestions: match?.availableQuestions ?? 0,
          };
        }),
      },
      subjects: subjectsAndChapters,
    };
  }
}
