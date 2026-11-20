import {
  AttendanceStatus,
  OfflineSessionStatus,
} from '../../generated/prisma/client.js';

export interface CreateOfflineSessionDto {
  assessmentTestId: string;
  sessionName: string;
  centerName?: string;
  roomNumber?: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  instructions?: string;
}

export interface UpdateOfflineSessionDto {
  sessionName?: string;
  centerName?: string;
  roomNumber?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  status?: OfflineSessionStatus;
  instructions?: string;
}

export interface RecordAttendanceItemDto {
  studentProfileId: string;
  assignedPaperSet?: string;
  deskNumber?: string;
  status?: AttendanceStatus;
  omrSheetCode?: string;
}

export interface RecordAttendanceDto {
  attendance: RecordAttendanceItemDto[];
}

export interface EnterOfflineAnswersDto {
  studentProfileId: string;
  rawAnswers: Record<string, string>; // { "1": "A", "2": "C", ... }
}
