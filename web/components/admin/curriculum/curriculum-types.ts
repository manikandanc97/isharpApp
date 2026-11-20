export interface CurriculumTopic {
  id: string;
  title: string;
  position: number;
  isCovered?: boolean;
  estimatedHours?: number;
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  isActive: boolean;
  courseSubjectId: string;
  topics: CurriculumTopic[];
}

export interface CurriculumSubject {
  id: string; // subject ID
  courseSubjectId: string; // CourseSubject join table ID
  code: string;
  name: string;
  description?: string | null;
  position: number;
  isActive: boolean;
  chaptersCount: number;
}

export interface SubjectFormData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface ChapterFormData {
  title: string;
  position: number;
  description?: string;
  isActive?: boolean;
}

export interface TopicFormData {
  title: string;
  position?: number;
  isCovered?: boolean;
}
