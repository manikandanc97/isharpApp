"use client";

import { CheckCircle2 } from "lucide-react";
import {
  SCREEN_MODULES,
  type RoleDefinition,
  type ScreenPermission,
} from "@/lib/roles-store";

function PermissionSummaryBadge({ perm }: { perm?: ScreenPermission }) {
  if (
    !perm ||
    (!perm.canRead && !perm.canCreate && !perm.canEdit && !perm.canDelete)
  ) {
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

export function RolePermissionsMatrix({ roles }: { roles: RoleDefinition[] }) {
  return (
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
  );
}
