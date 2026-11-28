"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
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
import { RoleCardsGrid } from "@/components/admin/roles/role-cards-grid";
import { RolePermissionsMatrix } from "@/components/admin/roles/role-permissions-matrix";
import type { RoleDefinition, ScreenPermission } from "@/lib/roles-store";

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
        setRoles(
          Array.isArray(data?.roles)
            ? data.roles
            : Array.isArray(data)
              ? data
              : [],
        );
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
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-3xs font-semibold uppercase tracking-wider text-brand-blue">
            Access Control
          </p>
          <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Roles &amp; Permissions
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage roles and screen-level Create, Edit, Delete, and View
            permissions.
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
            <RefreshCw
              className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
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

      <RoleCardsGrid
        roles={roles}
        onEditRole={openEditDialog}
        onDeleteRole={setDeleteTarget}
      />

      <RolePermissionsMatrix roles={roles} />

      <RoleEditorDialog
        key={`${editorMode}-${selectedRole?.id ?? "new"}-${editorOpen ? "open" : "closed"}`}
        open={editorOpen}
        mode={editorMode}
        role={selectedRole}
        saving={saving}
        onOpenChange={setEditorOpen}
        onSubmit={handleSaveRole}
      />

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
