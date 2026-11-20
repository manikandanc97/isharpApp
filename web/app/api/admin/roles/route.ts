import { NextRequest, NextResponse } from "next/server";
import { getRequestAccessToken } from "@/lib/server-access-token";

export type RoleDefinition = {
  id: string;
  name: string;
  title: string;
  description: string;
  permissions: {
    module: string;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  }[];
  usersCount: number;
};

const ROLES_CATALOG: RoleDefinition[] = [
  {
    id: "role-superadmin",
    name: "SUPERADMIN",
    title: "Super Administrator",
    description: "System root privileges, configuration, staff role assignment, and audit management",
    usersCount: 1,
    permissions: [
      { module: "All Modules", canRead: true, canWrite: true, canDelete: true },
    ],
  },
  {
    id: "role-admin",
    name: "ADMIN",
    title: "Administrator",
    description: "Full operational access across students, courses, questions, test series, exams, and results",
    usersCount: 2,
    permissions: [
      { module: "Platform Operations", canRead: true, canWrite: true, canDelete: true },
      { module: "System Configuration", canRead: true, canWrite: true, canDelete: false },
    ],
  },
  {
    id: "role-academic",
    name: "ACADEMIC_MANAGER",
    title: "Academic Manager",
    description: "Course and curriculum management, syllabus coverage, 91 chapters tracking, and academic years",
    usersCount: 2,
    permissions: [
      { module: "Courses & Curriculum", canRead: true, canWrite: true, canDelete: false },
      { module: "Question Bank", canRead: true, canWrite: false, canDelete: false },
      { module: "Results & Analytics", canRead: true, canWrite: false, canDelete: false },
    ],
  },
  {
    id: "role-question",
    name: "QUESTION_MANAGER",
    title: "Question Manager",
    description: "Author, import, validate, preview, and organize bilingual NEET questions in the Question Bank",
    usersCount: 3,
    permissions: [
      { module: "Question Bank", canRead: true, canWrite: true, canDelete: true },
      { module: "Courses Catalog", canRead: true, canWrite: false, canDelete: false },
    ],
  },
  {
    id: "role-exam",
    name: "EXAM_MANAGER",
    title: "Exam Manager",
    description: "Test series authoring, test creation, CBT exam window scheduling, proctoring, and attempt monitoring",
    usersCount: 2,
    permissions: [
      { module: "Test Series & Builder", canRead: true, canWrite: true, canDelete: true },
      { module: "Exam Management", canRead: true, canWrite: true, canDelete: true },
      { module: "Question Bank", canRead: true, canWrite: false, canDelete: false },
    ],
  },
  {
    id: "role-evaluator",
    name: "EVALUATOR",
    title: "Evaluator",
    description: "Authorized access to exam scorecards, student answer sheets, percentile analytics, and rankings",
    usersCount: 4,
    permissions: [
      { module: "Results & Analytics", canRead: true, canWrite: false, canDelete: false },
      { module: "Exam Attempts", canRead: true, canWrite: false, canDelete: false },
    ],
  },
  {
    id: "role-student",
    name: "STUDENT",
    title: "Enrolled Learner",
    description: "Authorized tests, daily practice papers, and individual released results only",
    usersCount: 3,
    permissions: [
      { module: "Student Portal", canRead: true, canWrite: false, canDelete: false },
      { module: "Own Submissions", canRead: true, canWrite: true, canDelete: false },
    ],
  },
];

export async function GET(request: NextRequest) {
  const token = await getRequestAccessToken(request);
  if (!token) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  return NextResponse.json(ROLES_CATALOG);
}
