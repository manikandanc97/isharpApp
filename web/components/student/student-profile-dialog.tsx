"use client";

import { LoaderCircle, Pencil, User } from "lucide-react";
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
  const studentCategory = session?.studentAccess?.category ?? "INTERNAL";
  const studentIdDisplay = session?.studentAccess?.studentId || "Student ID unavailable";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
        <DialogHeader>
          <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-brand-blue">
            <User className="size-5" />
          </div>
          <DialogTitle className="mt-3 type-section-title text-slate-900">
            My Profile
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-slate-500">
            Your verified student ID and sign-in email cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-4">
          <label className="block text-xs font-semibold text-slate-700">
            Display name
            <div className="relative mt-1.5">
              <Pencil className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void onSave();
                }}
                maxLength={150}
                autoComplete="name"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-blue focus:ring-3 focus:ring-indigo-100"
              />
            </div>
          </label>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div>
              <p className="font-semibold text-slate-500">Student ID</p>
              <p className="mt-1 break-all font-mono font-semibold text-slate-900">{studentIdDisplay}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-500">Access</p>
              <p className="mt-1 font-semibold text-slate-900">{studentCategory}</p>
            </div>
            {session?.email && (
              <div className="sm:col-span-2">
                <p className="font-semibold text-slate-500">Sign-in email</p>
                <p className="mt-1 break-all font-medium text-slate-900">{session.email}</p>
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
            className="w-full rounded-xl bg-brand-red font-semibold text-white hover:bg-brand-red-hover"
          >
            {savingProfile ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Pencil className="mr-2 size-4" />
            )}
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

