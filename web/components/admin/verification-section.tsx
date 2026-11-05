"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDate,
  initials,
  LightEmpty,
  LightLuxuryPanel,
  LightStatusBadge,
  titleCase,
} from "./admin-helpers";
import type { Membership } from "./admin-types";

// Legacy verification UI retained for audit-history compatibility.
export function Verification({
  memberships,
  onDecide,
}: {
  memberships: Membership[];
  onDecide: (
    membership: Membership,
    status: "VERIFIED" | "REJECTED" | "REVOKED",
  ) => void;
}) {
  const [filter, setFilter] = useState<"ALL" | Membership["status"]>("PENDING");
  const visible =
    filter === "ALL"
      ? memberships
      : memberships.filter((item) => item.status === filter);

  return (
    <LightLuxuryPanel
      title="Institution verification"
      description="Review membership claims. Every decision requires a reason and is audit logged."
    >
      <div className="flex flex-wrap gap-2">
        {(["PENDING", "VERIFIED", "REJECTED", "REVOKED", "ALL"] as const).map(
          (status) => {
            const count =
              status === "ALL"
                ? memberships.length
                : memberships.filter((item) => item.status === status).length;
            const isSelected = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  isSelected
                    ? "border border-brand-blue bg-brand-blue text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>
                  {status === "ALL" ? "All claims" : titleCase(status)}
                </span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-xs ${isSelected ? "bg-white/20" : "bg-slate-100"}`}
                >
                  {count}
                </span>
              </button>
            );
          },
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4.5 shadow-2xs transition hover:border-slate-300 sm:flex-row sm:items-center"
          >
            <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 font-semibold text-brand-red">
              {initials(item.user.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-900">
                  {item.user.displayName}
                </p>
                <LightStatusBadge status={item.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Student ID:{" "}
                <span className="font-semibold text-slate-700">
                  {item.studentId}
                </span>{" "}
                · Updated {formatDate(item.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.status !== "VERIFIED" && (
                <Button
                  size="sm"
                  onClick={() => onDecide(item, "VERIFIED")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <Check className="mr-1 size-3.5" />
                  Approve
                </Button>
              )}
              {item.status === "PENDING" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecide(item, "REJECTED")}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                >
                  Reject
                </Button>
              )}
              {item.status === "VERIFIED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecide(item, "REVOKED")}
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        ))}
        {!visible.length && <LightEmpty text="No requests in this view." />}
      </div>
    </LightLuxuryPanel>
  );
}
