"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  SCREEN_MODULES,
  type RoleDefinition,
  type ScreenModuleId,
  type ScreenPermission,
} from "@/lib/roles-store";

interface RoleEditorDialogProps {
  open: boolean;
  mode: "create" | "edit";
  role: RoleDefinition | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    name: string;
    title: string;
    description: string;
    permissions: ScreenPermission[];
  }) => Promise<void>;
}

function defaultPermissions(): ScreenPermission[] {
  return SCREEN_MODULES.map((screen) => ({
    screenId: screen.id,
    module: screen.label,
    canRead: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
  }));
}

export function RoleEditorDialog({
  open,
  mode,
  role,
  saving,
  onOpenChange,
  onSubmit,
}: RoleEditorDialogProps) {
  const [name, setName] = useState(() => (mode === "edit" && role ? role.name : ""));
  const [title, setTitle] = useState(() => (mode === "edit" && role ? role.title : ""));
  const [description, setDescription] = useState(() =>
    mode === "edit" && role ? role.description : "",
  );
  const [permissions, setPermissions] = useState<ScreenPermission[]>(() =>
    mode === "edit" && role
      ? role.permissions.map((p) => ({ ...p }))
      : defaultPermissions(),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isAdminSystemRole = mode === "edit" && role?.name === "ADMIN";
  const isSystemRole = mode === "edit" && Boolean(role?.isSystem);

  const toggleAction = (
    screenId: ScreenModuleId,
    field: "canRead" | "canCreate" | "canEdit" | "canDelete",
    checked: boolean,
  ) => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (perm.screenId !== screenId) return perm;
        if (isAdminSystemRole && screenId === "roles" && (field === "canRead" || field === "canEdit")) {
          return perm;
        }
        const next = { ...perm, [field]: checked };
        if ((field === "canCreate" || field === "canEdit" || field === "canDelete") && checked) {
          next.canRead = true;
        }
        if (field === "canRead" && !checked) {
          next.canCreate = false;
          next.canEdit = false;
          next.canDelete = false;
        }
        return next;
      }),
    );
  };

  const toggleRowAll = (screenId: ScreenModuleId, checked: boolean) => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (perm.screenId !== screenId) return perm;
        if (isAdminSystemRole && screenId === "roles") {
          return { ...perm, canRead: true, canCreate: true, canEdit: true, canDelete: true };
        }
        return {
          ...perm,
          canRead: checked,
          canCreate: checked,
          canEdit: checked,
          canDelete: checked,
        };
      }),
    );
  };

  const applyPreset = (preset: "full" | "view" | "clear") => {
    setPermissions((prev) =>
      prev.map((perm) => {
        if (isAdminSystemRole && perm.screenId === "roles") {
          return { ...perm, canRead: true, canCreate: true, canEdit: true, canDelete: true };
        }
        if (preset === "full") {
          return { ...perm, canRead: true, canCreate: true, canEdit: true, canDelete: true };
        }
        if (preset === "view") {
          return { ...perm, canRead: true, canCreate: false, canEdit: false, canDelete: false };
        }
        return { ...perm, canRead: false, canCreate: false, canEdit: false, canDelete: false };
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (mode === "create" && name.trim().length < 2) {
      setFormError("Role code must be at least 2 characters (e.g. STAFF, COORDINATOR).");
      return;
    }
    if (title.trim().length < 2) {
      setFormError("Role title must be at least 2 characters.");
      return;
    }
    try {
      await onSubmit({
        name: name.trim(),
        title: title.trim(),
        description: description.trim(),
        permissions,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShieldCheck className="size-5 text-brand-blue" />
            <span>{mode === "create" ? "Add New Role" : `Edit Role — ${role?.name}`}</span>
          </DialogTitle>
          <DialogDescription>
            Configure role details and screen-level View, Create, Edit, and Delete permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="role-code">Role Code</Label>
              <Input
                id="role-code"
                value={name}
                disabled={isSystemRole || mode === "edit"}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="e.g. ACADEMIC_STAFF"
                required={mode === "create"}
              />
              <p className="text-[11px] text-slate-400">
                {mode === "edit"
                  ? "Role code cannot be changed after creation."
                  : "Uppercase identifier (letters, numbers, underscores)."}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-title">Display Title</Label>
              <Input
                id="role-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Academic Staff"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Description</Label>
            <Textarea
              id="role-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of responsibilities for this role..."
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Screen &amp; Action Permissions
              </Label>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => applyPreset("full")}
                >
                  Full Control
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => applyPreset("view")}
                >
                  View Only
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  onClick={() => applyPreset("clear")}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3.5 py-2.5">Screen / Module</th>
                    <th className="px-2.5 py-2.5 text-center">View</th>
                    <th className="px-2.5 py-2.5 text-center">Create</th>
                    <th className="px-2.5 py-2.5 text-center">Edit</th>
                    <th className="px-2.5 py-2.5 text-center">Delete</th>
                    <th className="px-2.5 py-2.5 text-center">All</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map((perm) => {
                    const allChecked =
                      perm.canRead && perm.canCreate && perm.canEdit && perm.canDelete;
                    const lockedRolesRow = isAdminSystemRole && perm.screenId === "roles";

                    return (
                      <tr key={perm.screenId} className="hover:bg-slate-50/60">
                        <td className="px-3.5 py-2.5 font-medium text-slate-800">
                          <span className="inline-flex items-center gap-1.5">
                            {perm.module}
                            {lockedRolesRow && (
                              <Lock
                                className="size-3 text-slate-400"
                                aria-label="Protected admin permission"
                              />
                            )}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.canRead}
                              disabled={lockedRolesRow}
                              onCheckedChange={(checked) =>
                                toggleAction(perm.screenId, "canRead", Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.canCreate}
                              onCheckedChange={(checked) =>
                                toggleAction(perm.screenId, "canCreate", Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.canEdit}
                              disabled={lockedRolesRow}
                              onCheckedChange={(checked) =>
                                toggleAction(perm.screenId, "canEdit", Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={perm.canDelete}
                              onCheckedChange={(checked) =>
                                toggleAction(perm.screenId, "canDelete", Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={allChecked}
                              disabled={lockedRolesRow}
                              onCheckedChange={(checked) =>
                                toggleRowAll(perm.screenId, Boolean(checked))
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : mode === "create"
                  ? "Create Role"
                  : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
