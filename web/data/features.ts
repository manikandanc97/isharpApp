import {
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  Flame,
  Languages,
  LineChart,
  ShieldCheck,
  Sparkles,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type FeatureItem = {
  id: string;
  number: string;
  category: string;
  tabTitle: string;
  tabSubtitle: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image: string;
  imageAlt: string;
  accent: "blue" | "red";
  metricBadge: {
    icon: LucideIcon;
    label: string;
    value: string;
  };
  highlightBadge: {
    icon: LucideIcon;
    label: string;
  };
  highlights: readonly string[];
  ctaText: string;
  ctaHref: string;
};

export const features: readonly FeatureItem[] = [
  {
    id: "practice",
    number: "01",
    category: "Daily Habit & Momentum",
    tabTitle: "Daily Practice",
    tabSubtitle: "DPPs & consistency",
    title: "Daily practice that transforms effort into reflex.",
    description:
      "Targeted Daily Practice Problems (DPP) engineered to build unbroken study momentum with instant solution analysis.",
    icon: BookOpenCheck,
    image: "/experience/daily-practice.webp",
    imageAlt: "Luxury 3D illustration of daily study calendar and milestone progress nodes",
    accent: "red",
    metricBadge: {
      icon: Flame,
      label: "Habit consistency",
      value: "94% on-track",
    },
    highlightBadge: {
      icon: Zap,
      label: "Adaptive difficulty scaling",
    },
    highlights: [
      "15-question focused daily practice sets",
      "Instant video breakdowns in Tamil & English",
      "Automated streak tracking & consistency rewards",
    ],
    ctaText: "Explore daily curriculum",
    ctaHref: "#academy",
  },
  {
    id: "mock",
    number: "02",
    category: "Exam-Ready Simulation",
    tabTitle: "Mock Simulation",
    tabSubtitle: "Timed test mastery",
    title: "Timed mock exams engineered for real NEET mastery.",
    description:
      "Condition your mindset for high-pressure testing with simulated papers calibrated to exact NTA exam difficulty.",
    icon: FileCheck2,
    image: "/experience/exam-testing.webp",
    imageAlt: "Luxury 3D illustration of precision chronograph timer and exam sheets",
    accent: "red",
    metricBadge: {
      icon: Timer,
      label: "Exam benchmark",
      value: "0.2s precision timing",
    },
    highlightBadge: {
      icon: ShieldCheck,
      label: "NTA standard question bank",
    },
    highlights: [
      "Full-length NEET pattern test simulations",
      "Question-by-question speed & accuracy analytics",
      "Comparative national percentile rank benchmark",
    ],
    ctaText: "Explore mock test series",
    ctaHref: "#academy",
  },
  {
    id: "bilingual",
    number: "03",
    category: "Bilingual Concept Depth",
    tabTitle: "Bilingual Learning",
    tabSubtitle: "தமிழ் + English clarity",
    title: "Deep concept clarity delivered in Tamil + English.",
    description:
      "Master complex scientific derivations through intuitive Tamil-led explanations paired with standard English terms.",
    icon: Languages,
    image: "/experience/bilingual-learning.webp",
    imageAlt: "Luxury 3D illustration of glowing bilingual typography ribbons and audio waves",
    accent: "red",
    metricBadge: {
      icon: Sparkles,
      label: "Concept grasp speed",
      value: "2.4x faster retention",
    },
    highlightBadge: {
      icon: CheckCircle2,
      label: "Dual-language synchronized audio",
    },
    highlights: [
      "Tamil audio synced with standard English terms",
      "Bilingual annotated lecture notes & mind maps",
      "Direct 1-on-1 doubt clearing in your language",
    ],
    ctaText: "Sample a bilingual lecture",
    ctaHref: "#academy",
  },
  {
    id: "analytics",
    number: "04",
    category: "Precision Diagnostic Radar",
    tabTitle: "Smart Analytics",
    tabSubtitle: "Predictive rank radar",
    title: "Precision analytics that pinpoint your next rank.",
    description:
      "Eliminate guesswork with an automated diagnostic engine that pinpoints knowledge gaps and creates revision paths.",
    icon: LineChart,
    image: "/experience/precision-analytics.webp",
    imageAlt: "Luxury 3D illustration of holographic diagnostic charts and target reticle",
    accent: "blue",
    metricBadge: {
      icon: Zap,
      label: "Target precision",
      value: "Sub-topic accuracy radar",
    },
    highlightBadge: {
      icon: ShieldCheck,
      label: "Predictive NEET score trajectory",
    },
    highlights: [
      "Diagnostic heatmap pinpointing knowledge gaps",
      "Automated priority revision queue for marks",
      "Predictive NEET score & rank trajectory radar",
    ],
    ctaText: "View diagnostic system",
    ctaHref: "#academy",
  },
] as const;

export const ROTATION_INTERVAL_MS = 6000;

