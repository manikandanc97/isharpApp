import { describe, expect, it } from "vitest";
import {
  filterStudentDirectory,
  resolveRosterForUser,
} from "./student-search-utils";
import type { InternalStudent, User } from "./admin-types";

describe("student-search-utils", () => {
  const mockInternalStudents: InternalStudent[] = [
    {
      id: "roster-1",
      studentId: "ISH-2026-001",
      fullName: "Ananya Sharma",
      email: "ananya@example.com",
      authUserId: "auth-1",
      isActive: true,
      createdAt: "2026-01-01T10:00:00Z",
      updatedAt: "2026-01-01T10:00:00Z",
    },
    {
      id: "roster-2",
      studentId: "ISH-2026-002",
      fullName: "Karthik Raj",
      email: "karthik@example.com",
      authUserId: null,
      isActive: true,
      createdAt: "2026-01-02T10:00:00Z",
      updatedAt: "2026-01-02T10:00:00Z",
    },
  ];

  const mockUsers: User[] = [
    {
      id: "user-1",
      authUserId: "auth-1",
      displayName: "Ananya Sharma",
      email: "ananya@example.com",
      phone: "9876543210",
      roles: ["STUDENT"],
      isActive: true,
      createdAt: "2026-01-01T12:00:00Z",
      institutionMembership: {
        id: "mem-1",
        studentId: "ISH-2026-001",
        studentCategory: "INTERNAL",
        trustedRecordId: "roster-1",
        status: "VERIFIED",
        paymentStatus: "NOT_REQUIRED",
        paidAccessUntil: null,
        studentIdHistory: [
          {
            id: "hist-1",
            studentCode: "EXT-001",
            studentType: "EXTERNAL",
            changeReason: "Joined as internal scholar",
            isCurrent: false,
            createdAt: "2025-12-01T00:00:00Z",
          },
          {
            id: "hist-2",
            studentCode: "ISH-2026-001",
            studentType: "INTERNAL",
            changeReason: "Assigned internal roll number",
            isCurrent: true,
            createdAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    },
    {
      id: "user-2",
      authUserId: "auth-2",
      displayName: "Priya Sundar",
      email: "priya@example.com",
      phone: "9123456780",
      roles: ["STUDENT"],
      isActive: true,
      createdAt: "2026-01-03T10:00:00Z",
      institutionMembership: {
        id: "mem-2",
        studentId: "EXT-2026-042",
        studentCategory: "EXTERNAL",
        trustedRecordId: null,
        status: "VERIFIED",
        paymentStatus: "PAID",
        paidAccessUntil: "2026-12-31T00:00:00Z",
        studentIdHistory: [],
      },
    },
  ];

  describe("resolveRosterForUser", () => {
    it("matches user to internal roster by trustedRecordId", () => {
      const rosterById = new Map([[mockInternalStudents[0].id, mockInternalStudents[0]]]);
      const rosterByEmail = new Map<string, InternalStudent>();
      const rosterByStudentId = new Map<string, InternalStudent>();

      const matched = resolveRosterForUser(
        mockUsers[0],
        rosterById,
        rosterByEmail,
        rosterByStudentId
      );
      expect(matched?.id).toBe("roster-1");
      expect(matched?.fullName).toBe("Ananya Sharma");
    });

    it("matches user to internal roster by email when trustedRecordId is absent", () => {
      const userWithoutTrusted: User = {
        ...mockUsers[0],
        institutionMembership: {
          ...mockUsers[0].institutionMembership!,
          trustedRecordId: null,
        },
      };

      const rosterById = new Map<string, InternalStudent>();
      const rosterByEmail = new Map([[mockInternalStudents[0].email!.toLowerCase(), mockInternalStudents[0]]]);
      const rosterByStudentId = new Map<string, InternalStudent>();

      const matched = resolveRosterForUser(
        userWithoutTrusted,
        rosterById,
        rosterByEmail,
        rosterByStudentId
      );
      expect(matched?.id).toBe("roster-1");
    });
  });

  describe("filterStudentDirectory", () => {
    it("returns combined account and unlinked roster entries sorted by createdAt descending", () => {
      const entries = filterStudentDirectory({
        users: mockUsers,
        internalStudents: mockInternalStudents,
        query: "",
        studentType: "ALL",
      });

      // User 2 (Jan 3) -> Roster 2 unlinked (Jan 2) -> User 1 (Jan 1)
      expect(entries).toHaveLength(3);
      expect(entries[0].id).toBe("account-user-2");
      expect(entries[1].id).toBe("roster-roster-2");
      expect(entries[2].id).toBe("account-user-1");
    });

    it("filters by studentType INTERNAL", () => {
      const entries = filterStudentDirectory({
        users: mockUsers,
        internalStudents: mockInternalStudents,
        query: "",
        studentType: "INTERNAL",
      });

      expect(entries).toHaveLength(2);
      expect(entries.every((e) => e.kind === "roster" || (e.kind === "account" && e.user.institutionMembership?.studentCategory === "INTERNAL"))).toBe(true);
    });

    it("filters by studentType EXTERNAL", () => {
      const entries = filterStudentDirectory({
        users: mockUsers,
        internalStudents: mockInternalStudents,
        query: "",
        studentType: "EXTERNAL",
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("account-user-2");
    });

    it("searches by studentId history code", () => {
      const entries = filterStudentDirectory({
        users: mockUsers,
        internalStudents: mockInternalStudents,
        query: "EXT-001",
        studentType: "ALL",
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("account-user-1");
    });

    it("searches by student name across accounts and unlinked roster", () => {
      const entries = filterStudentDirectory({
        users: mockUsers,
        internalStudents: mockInternalStudents,
        query: "Karthik",
        studentType: "ALL",
      });

      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe("roster-roster-2");
    });
  });
});
