import { describe, expect, it } from "vitest";
import { auditLogsStore } from "./audit-logs-store";

describe("System Audit Logs Store", () => {
  it("initializes with immutable compliance log records", () => {
    const logs = auditLogsStore.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(4);

    const qbLog = logs.find((l) => l.module === "QUESTION_BANK");
    expect(qbLog).toBeDefined();
    expect(qbLog?.action).toBe("IMPORT_QUESTIONS");
  });

  it("filters logs by operational module", () => {
    const coursesLogs = auditLogsStore.getLogs("COURSES");
    expect(coursesLogs.length).toBeGreaterThanOrEqual(1);
    expect(coursesLogs.every((l) => l.module === "COURSES")).toBe(true);
  });

  it("appends new audit actions with timestamps", () => {
    const beforeCount = auditLogsStore.getLogs().length;
    const added = auditLogsStore.logAction({
      actorEmail: "superadmin@isharp.edu",
      actorRole: "SUPERADMIN",
      action: "SECURITY_UPDATE",
      module: "SETTINGS",
      targetEntityId: "AUTH-01",
      targetEntityName: "RBAC Configuration",
      details: "Updated permission matrix for Evaluator role",
      ipAddress: "127.0.0.1",
    });

    expect(added.id).toBeDefined();
    expect(added.timestamp).toBeDefined();

    const afterLogs = auditLogsStore.getLogs();
    expect(afterLogs.length).toBe(beforeCount + 1);
    expect(afterLogs[0].action).toBe("SECURITY_UPDATE");
  });
});
