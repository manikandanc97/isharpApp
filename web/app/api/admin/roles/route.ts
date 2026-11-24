import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "@/lib/server-access-token";
import { getNestApiClient } from "@/lib/nest-api";

export type RoleDefinition = {
  id: string;
  name: string;
  title: string;
  description: string;
  permissions: {
    module: string;
    canRead: boolean;
    canWrite: boolean;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete: boolean;
  }[];
  usersCount: number;
};

const ROLES_CATALOG: RoleDefinition[] = [
  {
    id: "role-superadmin",
    name: "SUPERADMIN",
    title: "Super Administrator",
    description: "System root privileges, global configuration, staff role assignment, security policies, and audit management",
    usersCount: 1,
    permissions: [
      { module: "All Modules (Full Root Access)", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "Platform Operations", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "System Configuration & Governance", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
    ],
  },
  {
    id: "role-admin",
    name: "ADMIN",
    title: "Administrator",
    description: "Full operational control with complete Create, Edit, and Delete privileges across students, courses, questions, exams, and settings",
    usersCount: 2,
    permissions: [
      { module: "Platform Operations", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "System Configuration & Settings", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "Student Directory & Enrollment", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "Courses & Question Bank", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
      { module: "Test Series, Exams & Results", canRead: true, canWrite: true, canCreate: true, canEdit: true, canDelete: true },
    ],
  },
  {
    id: "role-student",
    name: "STUDENT",
    title: "Enrolled Learner",
    description: "Authorized practice questions, daily test series, CBT exam window attempts, and individual released scorecards",
    usersCount: 3,
    permissions: [
      { module: "Student Portal & Study Content", canRead: true, canWrite: false, canCreate: false, canEdit: false, canDelete: false },
      { module: "Exam Attempts & Submissions", canRead: true, canWrite: true, canCreate: true, canEdit: false, canDelete: false },
      { module: "Personal Performance & Scorecards", canRead: true, canWrite: false, canCreate: false, canEdit: false, canDelete: false },
    ],
  },
];

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  // Attempt to fetch live count of students from the backend overview
  let dynamicStudentCount = 3;
  try {
    const overview = await getNestApiClient().request<{ totalStudents?: number }>(
      "/api/admin/overview",
      { accessToken: token, cache: "no-store" }
    );
    if (typeof overview?.totalStudents === "number") {
      dynamicStudentCount = overview.totalStudents;
    }
  } catch {
    // Graceful fallback to static count if backend is unreachable
  }

  const catalog = ROLES_CATALOG.map((role) =>
    role.name === "STUDENT" ? { ...role, usersCount: dynamicStudentCount } : role
  );

  return NextResponse.json(catalog);
}
