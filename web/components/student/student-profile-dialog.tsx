"use client";

import { useState } from "react";
import { Check, Copy, LoaderCircle, Pencil, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AuthenticatedSession } from "@/lib/auth-session";

export interface StudentProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AuthenticatedSession | null;
  profileName: string;
  setProfileName: (name: string) => void;
  profileError: string;
  savingProfile: boolean;
  onSave: () => Promise<void>;
}

export function StudentProfileDialog({
  open,
  onOpenChange,
  session,
  profileName,
  setProfileName,
  profileError,
  savingProfile,
  onSave,
}: StudentProfileDialogProps) {
  const [copiedId, setCopiedId] = useState(false);
  const studentCategory = session?.studentAccess?.category ?? "INTERNAL";
  const studentIdDisplay = session?.studentAccess?.studentId || "Student ID unavailable";
  const initial = (profileName.trim() || "S").charAt(0).toUpperCase();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(studentIdDisplay);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-red to-rose-400 font-bold text-white shadow-xs text-base">
              {initial}
            </div>
            <div>
              <DialogTitle className="type-section-title text-slate-900">
                Academic Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Verified Academy Student Credentials
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Display Name
            <div className="relative mt-1.5">
              <Pencil className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void onSave();
                }}
                maxLength={150}
                autoComplete="name"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/10"
              />
            </div>
          </label>

          {/* Academic Credentials Box */}
          <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-500">Student Roll / ID</p>
              <div className="mt-1 flex items-center gap-1.5 font-mono font-bold text-slate-900">
                <span>{studentIdDisplay}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="rounded p-1 text-slate-400 hover:text-slate-700"
                  title="Copy Student ID"
                >
                  {copiedId ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-500">Access Tier</p>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-800 text-3xs font-bold"
                >
                  <ShieldCheck className="mr-1 size-3" />
                  {studentCategory} PASS
                </Badge>
              </div>
            </div>

            {session?.email && (
              <div className="sm:col-span-2 border-t border-slate-200/60 pt-2">
                <p className="font-semibold text-slate-500">Registered Email</p>
                <p className="mt-0.5 break-all font-medium text-slate-800">{session.email}</p>
              </div>
            )}
          </div>

          {profileError && (
            <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {profileError}
            </p>
          )}

          <Button
            onClick={() => void onSave()}
            disabled={savingProfile || !profileName.trim()}
            className="w-full rounded-full bg-brand-red py-2.5 text-xs sm:text-sm font-semibold text-white shadow-primary hover:bg-brand-red-hover"
          >
            {savingProfile ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Pencil className="mr-2 size-4" />
            )}
            {savingProfile ? "Saving changes..." : "Save Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
