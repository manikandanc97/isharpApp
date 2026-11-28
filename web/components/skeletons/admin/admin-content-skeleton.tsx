import type { Section } from "@/components/admin/admin-types";
import {
  CoursesSkeleton,
  OverviewSkeleton,
  StudentsSkeleton,
} from "./sections/overview-skeleton";
import {
  QuestionBankSkeleton,
  ResultsSkeleton,
  TestSeriesSkeleton,
} from "./sections/operations-skeleton";
import {
  AuditLogsSkeleton,
  RolesSkeleton,
  SettingsSkeleton,
} from "./sections/system-skeleton";

export type AdminSkeletonSection =
  | Section
  | "overview"
  | "students"
  | "courses"
  | "tests";

export { QuestionBankSkeleton };

export function AdminWorkspaceContentSkeleton({
  section = "overview",
}: {
  section?: AdminSkeletonSection;
}) {
  if (section === "students") return <StudentsSkeleton />;
  if (section === "courses") return <CoursesSkeleton />;
  if (section === "questions") return <QuestionBankSkeleton />;
  if (section === "test-series" || section === "tests") {
    return <TestSeriesSkeleton />;
  }
  if (section === "results") return <ResultsSkeleton />;
  if (section === "audit-logs") return <AuditLogsSkeleton />;
  if (section === "roles") return <RolesSkeleton />;
  if (section === "settings") return <SettingsSkeleton />;
  return <OverviewSkeleton />;
}
