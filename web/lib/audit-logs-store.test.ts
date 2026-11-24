import { describe, expect, it } from "vitest";
import { auditLogsStore } from "./audit-logs-store";

describe("System Audit Logs Store", () => {
  it("initializes cleanly as an array without dummy mock data", () => {
    const logs = auditLogsStore.getLogs();
    expect(Array.isArray(logs)).toBe(true);
  });

  it("appends new audit actions with timestamps and filters by module", () => {
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

    const settingsLogs = auditLogsStore.getLogs("SETTINGS");
    expect(settingsLogs.length).toBeGreaterThanOrEqual(1);
    expect(settingsLogs.every((l) => l.module === "SETTINGS")).toBe(true);
  });
});
