export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  module: "COURSES" | "QUESTION_BANK" | "TEST_SERIES" | "EXAM_MANAGEMENT" | "RESULTS" | "ROLES" | "SETTINGS" | "STUDENTS";
  targetEntityId?: string | null;
  targetEntityName?: string | null;
  details: string;
  ipAddress?: string;
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log-001",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    actorEmail: "admin@isharpacademy.in",
    actorRole: "SUPERADMIN",
    action: "IMPORT_QUESTIONS",
    module: "QUESTION_BANK",
    targetEntityId: "BATCH-2026-NOV",
    targetEntityName: "Excel 30-Column Import",
    details: "Imported 132 bilingual NEET questions across Physics, Chemistry, and Biology with verified images",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log-002",
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    actorEmail: "academic.lead@isharpacademy.in",
    actorRole: "ACADEMIC_MANAGER",
    action: "INDEX_CHAPTERS",
    module: "COURSES",
    targetEntityId: "NEET",
    targetEntityName: "NEET Coaching Programme",
    details: "Verified complete 91 chapters syllabus mapping (Physics: 23, Chemistry: 32, Biology: 36)",
    ipAddress: "192.168.1.14",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    actorEmail: "exam.head@isharpacademy.in",
    actorRole: "EXAM_MANAGER",
    action: "SCHEDULE_EXAM",
    module: "EXAM_MANAGEMENT",
    targetEntityId: "exam-live-01",
    targetEntityName: "Test 03 – Biology Chapter 1",
    details: "Configured live CBT examination window for 90 questions (360 marks) with auto-submission enabled",
    ipAddress: "192.168.1.18",
  },
  {
    id: "log-004",
    timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    actorEmail: "admin@isharpacademy.in",
    actorRole: "SUPERADMIN",
    action: "ASSIGN_ROLE",
    module: "ROLES",
    targetEntityId: "usr-042",
    targetEntityName: "Staff Member",
    details: "Assigned QUESTION_MANAGER permission to Dr. Swaminathan (Biology Faculty)",
    ipAddress: "192.168.1.10",
  },
  {
    id: "log-005",
    timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    actorEmail: "admin@isharpacademy.in",
    actorRole: "SUPERADMIN",
    action: "UPDATE_SYSTEM_SETTINGS",
    module: "SETTINGS",
    targetEntityId: "SYS-SETTINGS",
    targetEntityName: "Academy Test Defaults",
    details: "Updated default NTA scoring blueprint to +4 correct and -1 incorrect penalty across all CBT tests",
    ipAddress: "192.168.1.10",
  },
];

class AuditLogsDataStore {
  private logs: AuditLogEntry[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));

  getLogs(moduleFilter?: string): AuditLogEntry[] {
    if (!moduleFilter || moduleFilter === "ALL") return [...this.logs];
    return this.logs.filter((l) => l.module === moduleFilter);
  }

  logAction(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const newLog: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.logs.unshift(newLog);
    return newLog;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __auditLogsStore: AuditLogsDataStore | undefined;
}

export const auditLogsStore = globalThis.__auditLogsStore ?? new AuditLogsDataStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__auditLogsStore = auditLogsStore;
}
