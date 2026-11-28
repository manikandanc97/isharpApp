export type FollowUpStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "JOINED"
  | "NOT_INTERESTED";

export interface DemoLeadRecord {
  id: string;
  normalizedPhone: string;
  verificationMethod: "MOCK" | "SMS";
  isVerified: boolean;
  verifiedAt: string;
  firstAccessAt: string;
  lastAccessAt: string;
  totalAttempts: number;
  latestScore: number | null;
  latestMaxMarks: number | null;
  latestPercentage: number | null;
  marketingConsent: boolean;
  consentTimestamp: string | null;
  followUpStatus: FollowUpStatus;
  adminNotes: string | null;
}

export interface DemoLeadStats {
  totalLeads: number;
  todayLeads: number;
  completedTests: number;
  pendingFollowUp: number;
}

export interface DemoLeadListResponse {
  items: DemoLeadRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LeadAttemptRecord {
  id: string;
  status: string;
  subjectMode: string;
  languageMode: string;
  questionCount: number;
  durationMinutes: number;
  maxMarks: number;
  totalScore: number | null;
  correctCount: number | null;
  incorrectCount: number | null;
  unansweredCount: number | null;
  accuracyPercentage: number | null;
  timeSpentSeconds: number;
  startedAt: string;
  submittedAt: string | null;
}

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  JOINED: "Joined",
  NOT_INTERESTED: "Not Interested",
};

export const FOLLOW_UP_BADGES: Record<FollowUpStatus, string> = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  CONTACTED: "bg-amber-50 text-amber-700 border-amber-200",
  INTERESTED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  JOINED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  NOT_INTERESTED: "bg-slate-100 text-slate-600 border-slate-200",
};

export function formatLeadDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatLeadDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
