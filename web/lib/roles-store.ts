export const SCREEN_MODULES = [
  { id: "overview", label: "Overview & Dashboard" },
  { id: "students", label: "Students & Enrollment" },
  { id: "courses", label: "Courses & Curriculum" },
  { id: "questions", label: "Question Bank" },
  { id: "test-series", label: "Test Series & Exams" },
  { id: "results", label: "Results & Analytics" },
  { id: "roles", label: "Roles & Permissions" },
  { id: "settings", label: "Settings & Audit Logs" },
] as const;

export type ScreenModuleId = (typeof SCREEN_MODULES)[number]["id"];

export type ScreenPermission = {
  screenId: ScreenModuleId;
  module: string;
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export type RoleDefinition = {
  id: string;
  name: string;
  title: string;
  description: string;
  isSystem: boolean;
  permissions: ScreenPermission[];
  usersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoleInput = {
  name: string;
  title: string;
  description?: string;
  permissions?: Partial<ScreenPermission>[];
};

export type UpdateRoleInput = {
  title?: string;
  description?: string;
  permissions?: Partial<ScreenPermission>[];
};

function buildPermissions(
  overrides: Partial<
    Record<
      ScreenModuleId,
      Partial<Pick<ScreenPermission, "canRead" | "canCreate" | "canEdit" | "canDelete">>
    >
  >,
  defaultAll = false,
): ScreenPermission[] {
  return SCREEN_MODULES.map((screen) => {
    const entry = overrides[screen.id];
    return {
      screenId: screen.id,
      module: screen.label,
      canRead: Boolean(entry?.canRead ?? defaultAll),
      canCreate: Boolean(entry?.canCreate ?? defaultAll),
      canEdit: Boolean(entry?.canEdit ?? defaultAll),
      canDelete: Boolean(entry?.canDelete ?? defaultAll),
    };
  });
}

function normalizePermissionsInput(
  input?: Partial<ScreenPermission>[],
  fallback?: ScreenPermission[],
): ScreenPermission[] {
  const byId = new Map<string, Partial<ScreenPermission>>();
  if (Array.isArray(input)) {
    for (const item of input) {
      if (item && typeof item.screenId === "string") {
        byId.set(item.screenId, item);
      }
    }
  }
  const fallbackById = new Map<string, ScreenPermission>();
  if (Array.isArray(fallback)) {
    for (const item of fallback) {
      fallbackById.set(item.screenId, item);
    }
  }

  return SCREEN_MODULES.map((screen) => {
    const provided = byId.get(screen.id);
    const prev = fallbackById.get(screen.id);
    const canCreate = Boolean(provided?.canCreate ?? prev?.canCreate ?? false);
    const canEdit = Boolean(provided?.canEdit ?? prev?.canEdit ?? false);
    const canDelete = Boolean(provided?.canDelete ?? prev?.canDelete ?? false);
    // Any write action implies read/view access to the screen
    const canRead = Boolean(
      provided?.canRead ?? prev?.canRead ?? (canCreate || canEdit || canDelete),
    ) || canCreate || canEdit || canDelete;

    return {
      screenId: screen.id,
      module: screen.label,
      canRead,
      canCreate,
      canEdit,
      canDelete,
    };
  });
}

function normalizeRoleCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const INITIAL_EPOCH = "2026-01-01T00:00:00.000Z";

function createInitialRoles(): RoleDefinition[] {
  return [
    {
      id: "role-admin",
      name: "ADMIN",
      title: "Administrator",
      description:
        "Full control across all screens and modules with Create, Edit, Delete, and View permissions.",
      isSystem: true,
      usersCount: 0,
      createdAt: INITIAL_EPOCH,
      updatedAt: INITIAL_EPOCH,
      permissions: buildPermissions({}, true),
    },
    {
      id: "role-student",
      name: "STUDENT",
      title: "Student",
      description:
        "Access to enrolled courses, test series exam attempts, and personal results.",
      isSystem: true,
      usersCount: 0,
      createdAt: INITIAL_EPOCH,
      updatedAt: INITIAL_EPOCH,
      permissions: buildPermissions(
        {
          courses: { canRead: true },
          "test-series": { canRead: true, canCreate: true },
          results: { canRead: true },
        },
        false,
      ),
    },
  ];
}

class RolesDataStore {
  private roles: RoleDefinition[] = createInitialRoles();

  listRoles(): RoleDefinition[] {
    return this.roles.map((r) => ({
      ...r,
      permissions: r.permissions.map((p) => ({ ...p })),
    }));
  }

  getRoleById(id: string): RoleDefinition | undefined {
    const found = this.roles.find((r) => r.id === id);
    if (!found) return undefined;
    return {
      ...found,
      permissions: found.permissions.map((p) => ({ ...p })),
    };
  }

  createRole(input: CreateRoleInput): RoleDefinition {
    const code = normalizeRoleCode(input.name ?? "");
    if (code.length < 2 || code.length > 32) {
      throw new Error("Role code must be 2 to 32 alphanumeric characters");
    }
    if (this.roles.some((r) => r.name === code)) {
      throw new Error(`Role "${code}" already exists`);
    }
    const title = (input.title ?? "").trim();
    if (title.length < 2 || title.length > 60) {
      throw new Error("Role title must be 2 to 60 characters");
    }

    const now = new Date().toISOString();
    const created: RoleDefinition = {
      id: `role-${code.toLowerCase()}-${Date.now().toString(36)}`,
      name: code,
      title,
      description: (input.description ?? "").trim().slice(0, 240),
      isSystem: false,
      permissions: normalizePermissionsInput(input.permissions),
      usersCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.push(created);
    return {
      ...created,
      permissions: created.permissions.map((p) => ({ ...p })),
    };
  }

  updateRole(id: string, input: UpdateRoleInput): RoleDefinition {
    const index = this.roles.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Role not found");
    }

    const existing = this.roles[index];
    const nextTitle =
      input.title !== undefined ? input.title.trim() : existing.title;
    if (nextTitle.length < 2 || nextTitle.length > 60) {
      throw new Error("Role title must be 2 to 60 characters");
    }

    const nextDescription =
      input.description !== undefined
        ? input.description.trim().slice(0, 240)
        : existing.description;

    let nextPermissions = input.permissions
      ? normalizePermissionsInput(input.permissions, existing.permissions)
      : existing.permissions.map((p) => ({ ...p }));

    // Prevent locking ADMIN out of Roles & Permissions management
    if (existing.name === "ADMIN") {
      nextPermissions = nextPermissions.map((p) =>
        p.screenId === "roles"
          ? { ...p, canRead: true, canCreate: true, canEdit: true, canDelete: true }
          : p,
      );
    }

    const updated: RoleDefinition = {
      ...existing,
      title: nextTitle,
      description: nextDescription,
      permissions: nextPermissions,
      updatedAt: new Date().toISOString(),
    };

    this.roles[index] = updated;
    return {
      ...updated,
      permissions: updated.permissions.map((p) => ({ ...p })),
    };
  }

  deleteRole(id: string): RoleDefinition {
    const index = this.roles.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error("Role not found");
    }
    const target = this.roles[index];
    if (target.isSystem) {
      throw new Error(`System role "${target.name}" cannot be deleted`);
    }
    this.roles.splice(index, 1);
    return target;
  }

  resetForTests() {
    this.roles = createInitialRoles();
  }
}

declare global {
  var __rolesStore: RolesDataStore | undefined;
}

export const rolesStore = globalThis.__rolesStore ?? new RolesDataStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.__rolesStore = rolesStore;
}
