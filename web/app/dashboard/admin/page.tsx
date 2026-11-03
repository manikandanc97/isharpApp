import { redirect } from "next/navigation";
import { Suspense } from "react";

type LegacyAdminPageProps = {
  searchParams: Promise<{ section?: string | string[] }>;
};

async function RedirectToAdmin({
  searchParams,
}: LegacyAdminPageProps) {
  const requestedSection = (await searchParams).section;
  const section = Array.isArray(requestedSection)
    ? requestedSection[0]
    : requestedSection;
  const destination =
    section === "students"
      ? "/admin/students"
      : section === "courses"
        ? "/admin/courses"
        : "/admin";

  return redirect(destination);
}

export default function AdminDashboardPage({
  searchParams,
}: LegacyAdminPageProps) {
  return (
    <Suspense fallback={null}>
      <RedirectToAdmin searchParams={searchParams} />
    </Suspense>
  );
}
