export const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "Flexible / Anytime";
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return "Flexible / Anytime";
  }
}

export function getTimeGreeting(): { greeting: string; icon: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { greeting: "Good morning", icon: "🌅" };
  if (hour < 17) return { greeting: "Good afternoon", icon: "☀️" };
  return { greeting: "Good evening", icon: "🌙" };
}

export interface SubjectTheme {
  name: string;
  badgeBg: string;
  badgeText: string;
  borderHover: string;
  accentBg: string;
  pillBg: string;
  textColor: string;
}

export function getSubjectTheme(subjectName: string): SubjectTheme {
  const lower = subjectName.toLowerCase();
  if (lower.includes("physic")) {
    return {
      name: subjectName,
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
      badgeText: "text-sky-700",
      borderHover: "hover:border-sky-300",
      accentBg: "from-sky-500 to-blue-600",
      pillBg: "bg-sky-100/70 text-sky-800",
      textColor: "text-sky-600",
    };
  }
  if (lower.includes("chem")) {
    return {
      name: subjectName,
      badgeBg: "bg-purple-50 text-purple-700 border-purple-200",
      badgeText: "text-purple-700",
      borderHover: "hover:border-purple-300",
      accentBg: "from-purple-500 to-indigo-600",
      pillBg: "bg-purple-100/70 text-purple-800",
      textColor: "text-purple-600",
    };
  }
  if (lower.includes("bio") || lower.includes("botany") || lower.includes("zoology")) {
    return {
      name: subjectName,
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      badgeText: "text-emerald-700",
      borderHover: "hover:border-emerald-300",
      accentBg: "from-emerald-500 to-teal-600",
      pillBg: "bg-emerald-100/70 text-emerald-800",
      textColor: "text-emerald-600",
    };
  }
  if (lower.includes("math")) {
    return {
      name: subjectName,
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
      badgeText: "text-amber-700",
      borderHover: "hover:border-amber-300",
      accentBg: "from-amber-500 to-orange-600",
      pillBg: "bg-amber-100/70 text-amber-800",
      textColor: "text-amber-600",
    };
  }
  return {
    name: subjectName,
    badgeBg: "bg-slate-50 text-slate-700 border-slate-200",
    badgeText: "text-slate-700",
    borderHover: "hover:border-slate-300",
    accentBg: "from-slate-600 to-slate-800",
    pillBg: "bg-slate-100 text-slate-800",
    textColor: "text-slate-600",
  };
}

export function getDifficultyTheme(difficulty: string): {
  label: string;
  badge: string;
} {
  switch (difficulty) {
    case "EASY":
      return {
        label: "Easy",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        badge: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "HARD":
      return {
        label: "Hard",
        badge: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: difficulty,
        badge: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

