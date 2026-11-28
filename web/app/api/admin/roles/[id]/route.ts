import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "@/lib/server-access-token";
import { rolesStore } from "@/lib/roles-store";
import { auditLogsStore } from "@/lib/audit-logs-store";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = rolesStore.updateRole(id, body);

    auditLogsStore.logAction({
      actorEmail: "admin@isharp.edu",
      actorRole: "ADMIN",
      action: "ROLE_UPDATED",
      module: "ROLES",
      targetEntityId: updated.id,
      targetEntityName: updated.name,
      details: `Updated permissions and metadata for ${updated.title} (${updated.name})`,
    });

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update role";
    const status = message === "Role not found" ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const deleted = rolesStore.deleteRole(id);

    auditLogsStore.logAction({
      actorEmail: "admin@isharp.edu",
      actorRole: "ADMIN",
      action: "ROLE_DELETED",
      module: "ROLES",
      targetEntityId: deleted.id,
      targetEntityName: deleted.name,
      details: `Deleted custom role ${deleted.title} (${deleted.name})`,
    });

    return NextResponse.json({ deleted: true, id: deleted.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete role";
    const status =
      message === "Role not found"
        ? 404
        : message.includes("cannot be deleted")
          ? 403
          : 400;
    return NextResponse.json({ message }, { status });
  }
}
