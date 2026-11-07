"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog";

export type AuthenticatedAdminUser = {
  email: string;
  role: string;
  displayName: string;
};

interface AdminControlCenterPreviewProps {
  user: AuthenticatedAdminUser;
  onSignOutSuccess: () => void;
}

export function AdminControlCenterPreview({
  user,
  onSignOutSuccess,
}: AdminControlCenterPreviewProps) {
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmLogout() {
    setIsSubmitting(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setShowLogoutModal(false);
      onSignOutSuccess();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-red text-white shadow-xs">
            <ShieldCheck className="size-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900">{user.displayName}</p>
            <p className="text-xs font-medium text-slate-500">{user.role}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold"
        >
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
          Active Session
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-xs text-slate-600">
          Welcome to the <strong className="text-slate-900">I-Sharp Academy Control Center</strong>. All management tools are synchronized.
        </p>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Enrolments</p>
            <p className="text-lg font-semibold text-slate-900">1,000+</p>
            <p className="text-xs text-emerald-600 font-medium">Batch 2026 Active</p>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Simulated Mocks</p>
            <p className="text-lg font-semibold text-slate-900">25 Tests</p>
            <p className="text-xs text-brand-blue font-medium">720-Mark NTA Pattern</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div
            onClick={() => router.push("/admin/students")}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Users className="size-4 text-brand-blue" />
              <span className="font-semibold">Student Enrolment Approvals</span>
            </div>
            <Badge variant="secondary" className="text-xs">4 Pending</Badge>
          </div>

          <div
            onClick={() => router.push("/admin/courses")}
            className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-brand-red" />
              <span className="font-semibold">Question Bank Management</span>
            </div>
            <Badge variant="secondary" className="text-xs">Active</Badge>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-emerald-600" />
              <span className="font-semibold">Test Schedule Manager</span>
            </div>
            <span className="text-xs text-slate-400">NEET 2026</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin")}
            className="w-full justify-center text-xs font-semibold"
          >
            Go to Full Admin Dashboard
            <ArrowRight className="size-3.5 ml-1.5" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLogoutModal(true)}
          className="w-full text-slate-500 hover:text-rose-600 text-xs"
        >
          <LogOut className="size-3.5 mr-1" />
          Sign Out
        </Button>

        <LogoutConfirmationDialog
          open={showLogoutModal}
          onOpenChange={setShowLogoutModal}
          onConfirm={handleConfirmLogout}
          isLoading={isSubmitting}
          title="Log out of Administration?"
          description="Are you sure you want to sign out of the administrator session?"
        />
      </div>
    </div>
  );
}

