import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "@/lib/server-access-token";
import { getNestApiClient } from "@/lib/nest-api";
import { rolesStore, SCREEN_MODULES } from "@/lib/roles-store";
import { auditLogsStore } from "@/lib/audit-logs-store";

export type { RoleDefinition, ScreenPermission, ScreenModuleId } from "@/lib/roles-store";

type BackendUser = {
  roles?: string[];
};

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const roleCounts = new Map<string, number>();
  try {
    const users = await getNestApiClient().request<BackendUser[]>(
      "/api/admin/users",
      { accessToken: token, cache: "no-store" },
    );
    if (Array.isArray(users)) {
      for (const user of users) {
        if (!Array.isArray(user.roles)) continue;
        for (const roleName of user.roles) {
          roleCounts.set(roleName, (roleCounts.get(roleName) ?? 0) + 1);
        }
      }
    }
  } catch {
    // Fallback to overview student count if /api/admin/users is unavailable
    try {
      const overview = await getNestApiClient().request<{ totalStudents?: number }>(
        "/api/admin/overview",
        { accessToken: token, cache: "no-store" },
      );
      if (typeof overview?.totalStudents === "number") {
        roleCounts.set("STUDENT", overview.totalStudents);
      }
    } catch {
      // Leave counts at 0 if backend is unreachable
    }
  }

  const roles = rolesStore.listRoles().map((role) => ({
    ...role,
    usersCount: roleCounts.get(role.name) ?? 0,
  }));

  return NextResponse.json({ roles, screens: SCREEN_MODULES });
}

export async function POST(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = rolesStore.createRole(body);

    auditLogsStore.logAction({
      actorEmail: "admin@isharp.edu",
      actorRole: "ADMIN",
      action: "ROLE_CREATED",
      module: "ROLES",
      targetEntityId: created.id,
      targetEntityName: created.name,
      details: `Created role ${created.title} (${created.name})`,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create role";
    const status = message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ message }, { status });
  }
}
