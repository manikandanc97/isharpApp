"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminWorkspaceContentSkeleton } from "@/components/skeletons/admin-layout-skeleton";
import { RoleEditorDialog } from "@/components/admin/roles/role-editor-dialog";
import {
  SCREEN_MODULES,
  type RoleDefinition,
  type ScreenPermission,
} from "@/lib/roles-store";

interface RolesSectionProps {
  onNotice: (msg: string) => void;
  onError: (msg: string) => void;
}

export function RolesSection({ onNotice, onError }: RolesSectionProps) {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RoleDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(
    async (quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await fetch("/api/admin/roles", { cache: "no-store" });
        if (!res.ok) {
          onError("Failed to load roles and permissions");
          return;
        }
        const data = await res.json();
        setRoles(Array.isArray(data?.roles) ? data.roles : Array.isArray(data) ? data : []);
        if (quiet) {
          onNotice("Roles & permissions synchronized");
        }
      } catch {
        onError("Failed to load roles and permissions");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [onNotice, onError],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/admin/roles", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setRoles(
              Array.isArray(data?.roles)
                ? data.roles
                : Array.isArray(data)
                  ? data
                  : [],
            );
          }
        } else {
          onError("Failed to load roles and permissions");
        }
      })
      .catch(() => {
        if (active) onError("Failed to load roles and permissions");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onError]);

  const openCreateDialog = () => {
    setEditorMode("create");
    setSelectedRole(null);
    setEditorOpen(true);
  };

  const openEditDialog = (role: RoleDefinition) => {
    setEditorMode("edit");
    setSelectedRole(role);
    setEditorOpen(true);
  };

  const handleSaveRole = async (payload: {
    name: string;
    title: string;
    description: string;
    permissions: ScreenPermission[];
  }) => {
    setSaving(true);
    try {
      const url =
        editorMode === "create"
          ? "/api/admin/roles"
          : `/api/admin/roles/${encodeURIComponent(selectedRole!.id)}`;
      const method = editorMode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || "Failed to save role");
      }

      setEditorOpen(false);
      onNotice(
        editorMode === "create"
          ? `Role "${payload.name}" created`
          : `Permissions updated for "${selectedRole?.name}"`,
      );
      await loadData(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/roles/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        onError(body?.message || "Failed to delete role");
        return;
      }
      onNotice(`Role "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      await loadData(false);
    } catch {
      onError("Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <AdminWorkspaceContentSkeleton section="roles" />;

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
            Access Control
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Roles &amp; Permissions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage roles and screen-level Create, Edit, Delete, and View permissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={refreshing || loading}
            onClick={() => void loadData(true)}
            className="gap-1.5 rounded-full bg-white"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </Button>
          <Button
            size="sm"
            onClick={openCreateDialog}
            className="gap-1.5 rounded-full"
          >
            <Plus className="size-3.5" />
            <span>Add Role</span>
          </Button>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div
        className={`grid gap-4 ${
          roles.length >= 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"
        }`}
      >
        {roles.map((role) => {
          const activeScreens = role.permissions.filter(
            (p) => p.canRead || p.canCreate || p.canEdit || p.canDelete,
          );
          const fullControlCount = role.permissions.filter(
            (p) => p.canRead && p.canCreate && p.canEdit && p.canDelete,
          ).length;

          return (
            <div
              key={role.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-extrabold tracking-wider text-indigo-700">
                      {role.name}
                    </span>
                    {role.isSystem && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Core
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-3xs font-semibold text-slate-500">
                    <Users className="size-3" />
                    <span>{role.usersCount} users</span>
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">
                  {role.title}
                </h3>
                {role.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {role.description}
                  </p>
                )}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
                    Screen Access ({activeScreens.length}/{SCREEN_MODULES.length})
                  </p>
                  {fullControlCount === SCREEN_MODULES.length && (
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Full Control
                    </span>
                  )}
                </div>

                {activeScreens.length === 0 ? (
                  <p className="text-xs text-slate-400">No screen permissions assigned.</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {activeScreens.map((p) => (
                      <div
                        key={p.screenId}
                        className="flex items-center justify-between gap-2 text-slate-700"
                      >
                        <span className="truncate font-medium text-slate-800">
                          {p.module}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold">
                          {p.canRead && <span className="text-emerald-700">View</span>}
                          {p.canCreate && <span className="text-blue-700">Create</span>}
                          {p.canEdit && <span className="text-indigo-700">Edit</span>}
                          {p.canDelete && <span className="text-rose-700">Delete</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => openEditDialog(role)}
                    className="gap-1"
                  >
                    <Pencil className="size-3" />
                    <span>Edit Permissions</span>
                  </Button>
                  {!role.isSystem && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setDeleteTarget(role)}
                      className="gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="size-3" />
                      <span>Delete</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Screen & Module Permissions Matrix */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-200 bg-[#fbfbfa] p-5 sm:px-7">
          <h3 className="text-base font-bold text-slate-900">
            Screen &amp; Module Permissions Matrix
          </h3>
          <p className="text-xs text-slate-500">
            Live breakdown of View, Create, Edit, and Delete access per role
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-3xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Module / Screen</th>
                {roles.map((role) => (
                  <th key={role.id} className="px-5 py-3">
                    {role.title} ({role.name})
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SCREEN_MODULES.map((screen) => (
                <tr key={screen.id} className="transition hover:bg-slate-50/70">
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {screen.label}
                  </td>
                  {roles.map((role) => {
                    const perm = role.permissions.find(
                      (p) => p.screenId === screen.id,
                    );
                    return (
                      <td key={role.id} className="px-5 py-3.5">
                        <PermissionSummaryBadge perm={perm} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Role Dialog */}
      <RoleEditorDialog
        key={`${editorMode}-${selectedRole?.id ?? "new"}-${editorOpen ? "open" : "closed"}`}
        open={editorOpen}
        mode={editorMode}
        role={selectedRole}
        saving={saving}
        onOpenChange={setEditorOpen}
        onSubmit={handleSaveRole}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-slate-900">
                {deleteTarget?.title} ({deleteTarget?.name})
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteRole()}
            >
              {deleting ? "Deleting..." : "Delete Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissionSummaryBadge({ perm }: { perm?: ScreenPermission }) {
  if (!perm || (!perm.canRead && !perm.canCreate && !perm.canEdit && !perm.canDelete)) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  if (perm.canRead && perm.canCreate && perm.canEdit && perm.canDelete) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="size-4 text-emerald-600" />
        <span>Full Control</span>
      </span>
    );
  }

  const actions: string[] = [];
  if (perm.canRead) actions.push("View");
  if (perm.canCreate) actions.push("Create");
  if (perm.canEdit) actions.push("Edit");
  if (perm.canDelete) actions.push("Delete");

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
      {actions.join(" · ")}
    </span>
  );
}
