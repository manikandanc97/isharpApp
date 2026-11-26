import type { ReactNode } from "react";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}
