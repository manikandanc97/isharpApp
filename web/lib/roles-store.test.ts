import { beforeEach, describe, expect, it } from "vitest";
import { rolesStore, SCREEN_MODULES } from "./roles-store";

describe("rolesStore", () => {
  beforeEach(() => {
    rolesStore.resetForTests();
  });

  it("starts with only ADMIN and STUDENT core roles with clean zero counts", () => {
    const roles = rolesStore.listRoles();
    expect(roles.map((r) => r.name)).toEqual(["ADMIN", "STUDENT"]);
    expect(roles.every((r) => r.isSystem)).toBe(true);
    expect(roles.every((r) => r.usersCount === 0)).toBe(true);

    const admin = roles.find((r) => r.name === "ADMIN")!;
    expect(admin.permissions).toHaveLength(SCREEN_MODULES.length);
    expect(
      admin.permissions.every(
        (p) => p.canRead && p.canCreate && p.canEdit && p.canDelete,
      ),
    ).toBe(true);
  });

  it("creates, updates, and deletes a custom role with normalized code", () => {
    const created = rolesStore.createRole({
      name: "academic staff",
      title: "Academic Staff",
      description: "Manages courses and question bank",
      permissions: [
        { screenId: "courses", canCreate: true, canEdit: true },
        { screenId: "questions", canRead: true },
      ],
    });

    expect(created.name).toBe("ACADEMIC_STAFF");
    expect(created.isSystem).toBe(false);
    // canCreate/canEdit implies canRead
    const coursesPerm = created.permissions.find((p) => p.screenId === "courses")!;
    expect(coursesPerm).toMatchObject({
      canRead: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
    });

    const updated = rolesStore.updateRole(created.id, {
      title: "Senior Academic Staff",
      permissions: [{ screenId: "courses", canDelete: true }],
    });
    expect(updated.title).toBe("Senior Academic Staff");
    expect(updated.permissions.find((p) => p.screenId === "courses")?.canDelete).toBe(true);

    rolesStore.deleteRole(created.id);
    expect(rolesStore.listRoles().map((r) => r.name)).toEqual(["ADMIN", "STUDENT"]);
  });

  it("prevents duplicate role names, deleting system roles, and locking ADMIN out of roles screen", () => {
    expect(() =>
      rolesStore.createRole({ name: "ADMIN", title: "Duplicate Admin" }),
    ).toThrow(/already exists/i);

    expect(() => rolesStore.deleteRole("role-admin")).toThrow(/cannot be deleted/i);
    expect(() => rolesStore.deleteRole("role-student")).toThrow(/cannot be deleted/i);

    const updatedAdmin = rolesStore.updateRole("role-admin", {
      permissions: [
        { screenId: "roles", canRead: false, canCreate: false, canEdit: false, canDelete: false },
      ],
    });
    const rolesPerm = updatedAdmin.permissions.find((p) => p.screenId === "roles")!;
    expect(rolesPerm.canRead).toBe(true);
    expect(rolesPerm.canEdit).toBe(true);
  });
});
