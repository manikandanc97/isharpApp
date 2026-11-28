export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  module: "COURSES" | "QUESTION_BANK" | "TEST_SERIES" | "RESULTS" | "ROLES" | "SETTINGS" | "STUDENTS";
  targetEntityId?: string | null;
  targetEntityName?: string | null;
  details: string;
  ipAddress?: string;
};

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

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
  var __auditLogsStore: AuditLogsDataStore | undefined;
}

export const auditLogsStore = globalThis.__auditLogsStore ?? new AuditLogsDataStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__auditLogsStore = auditLogsStore;
}
