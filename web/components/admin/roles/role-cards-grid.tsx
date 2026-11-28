"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCREEN_MODULES, type RoleDefinition } from "@/lib/roles-store";

interface RoleCardsGridProps {
  roles: RoleDefinition[];
  onEditRole: (role: RoleDefinition) => void;
  onDeleteRole: (role: RoleDefinition) => void;
}

export function RoleCardsGrid({
  roles,
  onEditRole,
  onDeleteRole,
}: RoleCardsGridProps) {
  return (
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
                <p className="text-xs text-slate-400">
                  No screen permissions assigned.
                </p>
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
                        {p.canRead && (
                          <span className="text-emerald-700">View</span>
                        )}
                        {p.canCreate && (
                          <span className="text-blue-700">Create</span>
                        )}
                        {p.canEdit && (
                          <span className="text-indigo-700">Edit</span>
                        )}
                        {p.canDelete && (
                          <span className="text-rose-700">Delete</span>
                        )}
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
                  onClick={() => onEditRole(role)}
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
                    onClick={() => onDeleteRole(role)}
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
  );
}
