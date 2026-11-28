import {
  Award,
  BarChart3,
  BookOpen,
  HelpCircle,
  History,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export type AdminDashboardSection =
  | "overview"
  | "students"
  | "courses"
  | "questions"
  | "test-series"
  | "tests"
  | "results"
  | "roles"
  | "settings"
  | "audit-logs";

export type Section = AdminDashboardSection;

export const sectionPaths: Record<Section, string> = {
  overview: "/admin",
  students: "/admin/students",
  courses: "/admin/courses",
  questions: "/admin/question-bank",
  "test-series": "/admin/test-series",
  tests: "/admin/test-series",
  results: "/admin/results",
  roles: "/admin/roles",
  settings: "/admin/settings",
  "audit-logs": "/admin/audit-logs",
};

export const platformOperationSections: Section[] = [
  "overview",
  "students",
  "courses",
  "questions",
  "test-series",
  "results",
];

export const systemConfigurationSections: Section[] = [
  "roles",
  "settings",
  "audit-logs",
];

export type Metrics = {
  users: number;
  activeUsers: number;
  pendingVerifications: number;
  courses: number;
  subjects: number;
};

export type Membership = {
  id: string;
  studentId: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "REVOKED";
  method?: string | null;
  createdAt?: string;
  updatedAt: string;
  studentCategory: "INTERNAL" | "EXTERNAL";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  paidAccessUntil: string | null;
  user: {
    id: string;
    displayName: string;
    isActive?: boolean;
    userRoles?: { role: { name: string } }[];
  };
};

export type User = {
  id: string;
  authUserId: string | null;
  displayName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  institutionMembership: {
    id: string;
    studentId: string;
    trustedRecordId: string | null;
    status: Membership["status"];
    studentCategory: Membership["studentCategory"];
    paymentStatus: Membership["paymentStatus"];
    paidAccessUntil: string | null;
    studentIdHistory?: StudentIdHistory[];
  } | null;
};

export type StudentIdHistory = {
  id: string;
  studentCode: string;
  studentType: "INTERNAL" | "EXTERNAL";
  isCurrent: boolean;
  changeReason: string;
  createdAt: string;
};

export type InternalStudent = {
  id: string;
  studentId: string;
  fullName: string | null;
  email: string | null;
  authUserId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudentDirectoryEntry =
  | {
      kind: "account";
      id: string;
      createdAt: string;
      user: User;
      rosterStudent?: InternalStudent;
    }
  | {
      kind: "roster";
      id: string;
      createdAt: string;
      student: InternalStudent;
    };

export type CourseChapter = {
  id: string;
  title: string;
  description?: string | null;
  position?: number;
  isActive?: boolean;
};

export type CourseSubject = {
  id: string;
  subject: { id: string; code: string; name: string; description?: string | null };
  chapters?: CourseChapter[];
  _count: { chapters: number };
};

export type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  academicYear?: string;
  syllabusCoverage?: number;
  updatedAt: string;
  courseSubjects: CourseSubject[];
};

export function isStudentAccount(user: User) {
  return (
    user.roles.includes("STUDENT") &&
    !user.roles.some((role) => role === "ADMIN" || role === "SUPERADMIN")
  );
}

export const sectionMeta = {
  overview: {
    label: "Overview",
    icon: LayoutDashboard,
    description: "Executive Dashboard & Metrics",
    group: "operations",
  },
  students: {
    label: "Students",
    icon: Users,
    description: "Directory & Account Permissions",
    group: "operations",
  },
  courses: {
    label: "Courses",
    icon: BookOpen,
    description: "Curriculum & Syllabus Coverage",
    group: "operations",
  },
  questions: {
    label: "Question Bank",
    icon: HelpCircle,
    description: "NEET Question Library & Asset Pool",
    group: "operations",
  },
  "test-series": {
    label: "Test Series",
    icon: Award,
    description: "Categorized Mock & Practice Series",
    group: "operations",
  },
  tests: {
    label: "Test Series",
    icon: Award,
    description: "Assessment & Test Series Control",
    group: "operations",
  },
  results: {
    label: "Results & Analytics",
    icon: BarChart3,
    description: "Scorecards, Percentiles & Rankings",
    group: "operations",
  },
  roles: {
    label: "Roles & Permissions",
    icon: ShieldCheck,
    description: "RBAC & Staff Access Levels",
    group: "configuration",
  },
  settings: {
    label: "Settings",
    icon: Settings,
    description: "Academy Branding & Test Defaults",
    group: "configuration",
  },
  "audit-logs": {
    label: "Audit Logs",
    icon: History,
    description: "Security Events & Activity Trail",
    group: "configuration",
  },
} satisfies Record<
  Section,
  {
    label: string;
    icon: typeof LayoutDashboard;
    description: string;
    group: "operations" | "configuration";
  }
>;
