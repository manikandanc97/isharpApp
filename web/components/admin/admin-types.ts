import { BookOpen, LayoutDashboard, Users } from "lucide-react";

export type AdminDashboardSection = "overview" | "students" | "courses";
export type Section = AdminDashboardSection;

export const sectionPaths: Record<Section, string> = {
  overview: "/admin",
  students: "/admin/students",
  courses: "/admin/courses",
};

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
  } | null;
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

export type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  isActive: boolean;
  updatedAt: string;
  courseSubjects: {
    id: string;
    subject: { id: string; code: string; name: string };
    _count: { chapters: number };
  }[];
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
  },
  students: {
    label: "Students",
    icon: Users,
    description: "Directory & Account Permissions",
  },
  courses: {
    label: "Courses",
    icon: BookOpen,
    description: "Academic Catalog Management",
  },
} satisfies Record<
  Section,
  { label: string; icon: typeof LayoutDashboard; description: string }
>;

