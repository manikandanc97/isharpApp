"use client";

import {
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Languages,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type CurriculumModule = {
  title: string;
  topics: readonly string[];
};

type Course = {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: "blue" | "red";
  duration: string;
  language: string;
  targetAudience: string;
  deliverables: readonly string[];
  curriculumModules: readonly CurriculumModule[];
};

const courses: readonly Course[] = [
  {
    id: "tamil-batch",
    badge: "Tamil Batch",
    title: "10 மாதிரி தேர்வு - நீட் 2026",
    description: "தமிழ் கேள்விகள் மற்றும் ஆங்கிலத்தில் ஒரே பக்கத்தில் NCERT விளக்கம்.",
    icon: Languages,
    accent: "red",
    duration: "Full Year · Live + Recorded",
    language: "தமிழ் Medium Core",
    targetAudience: "TN State Board & Tamil Medium Students",
    deliverables: [
      "100% Tamil-led conceptual lectures & scientific derivations",
      "Dual-language annotated formula sheets & technical term glossaries",
      "Bilingual question papers with step-by-step Tamil video solutions",
      "Dedicated 1-on-1 Tamil mentor hotline for daily doubt clearance",
    ],
    curriculumModules: [
      {
        title: "Foundation & Terminology Bridge",
        topics: [
          "State Board to NCERT Syllabus Alignment",
          "2,000+ Bilingual Scientific Keyterms Dictionary",
          "Basic Mathematical Tools for Physics in தமிழ்",
          "Chemical IUPAC Names & Formula Balancing in தமிழ்",
        ],
      },
      {
        title: "Physics & Chemistry in தமிழ்",
        topics: [
          "Fundamental Laws Explained in Native Tamil",
          "Step-by-Step Numerical Derivation Workflows",
          "Organic Reactions with Intuitive Analogies",
          "Daily Bilingual Practice Drills",
        ],
      },
      {
        title: "Biology Dual Terminology",
        topics: [
          "Tamil Botanical & Zoological Translations",
          "NCERT Diagrams with Dual Tamil-English Labels",
          "Genetics & Biotech Explained in Simple Tamil",
          "Memory Mnemonics for High-Weightage Chapters",
        ],
      },
    ],
  },
  {
    id: "neet-full-course",
    badge: "Full Course",
    title: "NEET 2026 Full Course",
    description: "DPP, chapter tests, cumulative tests, PYQ and mock access.",
    icon: BookOpenCheck,
    accent: "red",
    duration: "12 Months · 700+ Lecture Hrs",
    language: "Bilingual (தமிழ் + English)",
    targetAudience: "Class 11, 12 & Repeater Aspirants",
    deliverables: [
      "700+ Hours live interactive classes with full 4K recorded archive",
      "Daily Practice Problems (15 DPPs/day) with step-by-step video solutions",
      "Weekly 720-mark cumulative tests with sub-topic diagnostic radar",
      "Dedicated 1-on-1 faculty academic doubt clearing & mentoring hotline",
    ],
    curriculumModules: [
      {
        title: "Physics Core",
        topics: [
          "Mechanics & Properties of Matter",
          "Electrodynamics & Magnetism",
          "Optics & Modern Physics",
          "Thermal Physics & Oscillations",
        ],
      },
      {
        title: "Chemistry Mastery",
        topics: [
          "Physical Chemistry Numericals & Thermodynamics",
          "Inorganic NCERT Line-by-Line Mastery",
          "Organic Mechanisms & Reaction Conversions",
          "Coordination Compounds & Polymers",
        ],
      },
      {
        title: "Biology (Botany & Zoology)",
        topics: [
          "Plant Physiology & Genetics",
          "Human Physiology & Endocrine Systems",
          "Cell Biology & Molecular Basis of Inheritance",
          "Biotechnology & Environmental Ecology",
        ],
      },
    ],
  },
  {
    id: "pyq-practice",
    badge: "PYQ Plan",
    title: "PYQ Practice Plan",
    description: "Previous year question practice and test mode for focused preparation.",
    icon: Sparkles,
    accent: "blue",
    duration: "3,500+ Solved Questions",
    language: "English & தமிழ்",
    targetAudience: "Self-Paced Practice & Repeater Aspirants",
    deliverables: [
      "Past 15 years' questions sorted by chapter, topic & difficulty",
      "Trap option analysis: why 3 choices are wrong & how to spot trick questions",
      "Bilingual video solutions with derivation shortcuts for complex problems",
      "Personalized mistake bookmarking & custom re-test practice engine",
    ],
    curriculumModules: [
      {
        title: "Question Database",
        topics: [
          "NEET Past Papers (2010–2025)",
          "JEE Main High-Yield Physics & Chemistry Questions",
          "AIPMT & Regional Pre-Medical Archives",
          "NTA Re-Exam Special Question Collections",
        ],
      },
      {
        title: "Analytical Layers",
        topics: [
          "Frequency Breakdown of Recurring Concepts",
          "Option Trap Decoders & Distractor Spotters",
          "Formula-Free Shortcut Elimination Methods",
          "Difficulty Index: Foundational, Moderate, Brain-Teaser",
        ],
      },
    ],
  },
  {
    id: "revision-tests",
    badge: "Short Plan",
    title: "15-Day Revision Tests",
    description: "Short revision plan with chapter practice and mock test access.",
    icon: Clock3,
    accent: "red",
    duration: "15-Day Intensive Sprint",
    language: "Bilingual (தமிழ் + English)",
    targetAudience: "Final 30-45 Days Before Examination",
    deliverables: [
      "Top 100 high-weightage chapter fast-track video capsules & mind maps",
      "Formula quick-recap cheat sheets & NCERT Biology tables",
      "Daily 45-minute rapid-fire speed tests under exam pressure",
      "AI-powered 'Mistake-Book' revision queue targeting personal weak spots",
    ],
    curriculumModules: [
      {
        title: "Sprint Curriculum",
        topics: [
          "Physics High-Scoring Mechanics & Modern Physics",
          "Chemistry Inorganic Memorization Tables & Organic Pathways",
          "Biology NCERT Direct Lines & High-Weightage Ecology",
          "Exam Day Time-Budgeting & Mental Stamina Protocols",
        ],
      },
      {
        title: "Speed Conditioning",
        topics: [
          "Daily 45-Minute Timed 50-Question Sprints",
          "Instant Answer Key & Conceptual Trap Walkthrough",
          "Elimination Drills to Reduce Negative Marking",
          "Personalized High-Yield Chapter Re-tests",
        ],
      },
    ],
  },
  {
    id: "neet-mock-tests",
    badge: "Mock Series",
    title: "10 Mock Test for RE-NEET 2026 (Eng)",
    description: "Full pattern mock practice with score report and analysis.",
    icon: FileCheck2,
    accent: "blue",
    duration: "10 Full Grand Mocks",
    language: "English & தமிழ்",
    targetAudience: "Exam-Year Aspirants (NEET 2026)",
    deliverables: [
      "10 Full-length 720-mark simulated exam papers strictly on NTA pattern",
      "Printable OMR answer sheets + Authentic CBT online test platform",
      "Real-time All-India Percentile & sub-topic negative-mark radar",
      "Instant bilingual video solutions with shortcut tricks for every question",
    ],
    curriculumModules: [
      {
        title: "Testing Phases",
        topics: [
          "Phase 1: High-Yield Sectional Simulations",
          "Phase 2: 10 Grand All-India Open Mocks",
          "Detailed Question-by-Question Analysis",
          "Diagnostic Negative-Mark Telemetry",
        ],
      },
    ],
  },
  {
    id: "jee-accelerator",
    badge: "Engineering",
    title: "JEE Main & Advanced 2026",
    description: "Calculus, mechanics, and CBT mock test practice for top percentile.",
    icon: BrainCircuit,
    accent: "red",
    duration: "12 Months · 300+ Practice Sets",
    language: "Bilingual (தமிழ் + English)",
    targetAudience: "Class 11, 12 & Droppers (Engineering)",
    deliverables: [
      "Advanced Calculus, Mechanics & Organic reaction pathways",
      "250+ Timed CBT mock simulations on authentic NTA test player",
      "Daily multi-tier problem sets (Level 1, Level 2 & Advanced Olympiad)",
      "Speed-solving shortcuts & multi-concept elimination strategies",
    ],
    curriculumModules: [
      {
        title: "Advanced Mathematics",
        topics: [
          "Differential & Integral Calculus Mastery",
          "Vectors, Matrices & 3D Analytical Geometry",
          "Permutations, Combinations & Probability Theory",
          "Complex Numbers & Coordinate Conic Sections",
        ],
      },
      {
        title: "JEE Physics & Chemistry",
        topics: [
          "Rotational Dynamics & Conservation Laws",
          "Electromagnetism & Wave Optics",
          "Physical Chemistry Thermodynamics & Kinetics",
          "Advanced Organic Mechanisms & Stereochemistry",
        ],
      },
    ],
  },
];

export function AvailableCourses() {
  return (
    <section
      id="courses"
      aria-labelledby="available-courses-title"
      className="relative overflow-hidden bg-white border-b border-slate-200/80 px-4 py-12 sm:px-8 sm:py-16 lg:py-20"
    >
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1.5 rounded-full border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-red"
            >
              <GraduationCap className="size-3.5 text-brand-red" aria-hidden="true" />
              <span>Curated Academic Programs</span>
            </Badge>
            <h2
              id="available-courses-title"
              className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-3xl"
            >
              Academic Programs &amp; Test Series
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Purpose-built preparation for NEET &amp; JEE with guided practice, verified NTA pattern rigor, and dual-language clarity.
            </p>
          </div>

          {/* Right Action: Batch Badge */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <Badge
              variant="outline"
              className="flex items-center gap-2 rounded-full border-slate-200 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-700 shadow-2xs"
            >
              <Users className="size-3.5 text-brand-red" />
              <span>Batch 2026</span>
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Badge>
          </div>
        </div>

        {/* Clean, Theme-Matched Luxury Cards Grid built with Shadcn Card */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const Icon = course.icon;
            const isBlue = course.accent === "blue";

            return (
              <Card
                key={course.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-300 hover:border-slate-300 hover:shadow-md"
              >
                {/* Subtle Top Accent Strip */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl transition-opacity",
                    isBlue ? "bg-brand-blue" : "bg-brand-red",
                  )}
                />

                <div>
                  {/* Top Row: Shadcn Badge + Clean Solid Icon */}
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-3 py-0.5 text-2xs font-bold uppercase tracking-wider",
                        isBlue
                          ? "border-blue-200 bg-blue-50 text-brand-blue"
                          : "border-rose-200 bg-rose-50 text-brand-red",
                      )}
                    >
                      {course.badge}
                    </Badge>

                    <div
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-xs",
                        isBlue ? "bg-brand-blue" : "bg-brand-red",
                      )}
                    >
                      <Icon className="size-4.5" strokeWidth={2} aria-hidden="true" />
                    </div>
                  </div>

                  {/* Course Title */}
                  <h3
                    className={cn(
                      "mt-4 text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-snug transition-colors",
                      isBlue ? "group-hover:text-brand-blue" : "group-hover:text-brand-red",
                    )}
                  >
                    {course.title}
                  </h3>

                  {/* Short description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {course.description}
                  </p>

                  {/* Metadata Chips: Language & Duration */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1.5 rounded-md border-slate-200 bg-slate-50 px-2.5 py-1 text-3xs font-semibold text-slate-700"
                    >
                      <Languages className="size-3 text-slate-500" />
                      <span>{course.language}</span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-1.5 rounded-md border-slate-200 bg-slate-50 px-2.5 py-1 text-3xs font-semibold text-slate-700"
                    >
                      <Clock3 className="size-3 text-slate-500" />
                      <span>{course.duration}</span>
                    </Badge>
                  </div>

                  {/* Separator between header and deliverables */}
                  <Separator className="my-4 bg-slate-100" />

                  {/* Key Highlights / Deliverables */}
                  <div>
                    <p className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                      Program Inclusions:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                      {course.deliverables.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-tight">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer: Clean Target Audience & Batch Status */}
                <div className="mt-5 border-t border-slate-100 pt-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium truncate pr-2">
                      {course.targetAudience}
                    </span>
                    <span className="inline-flex items-center gap-1.5 shrink-0 text-3xs font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Batch 2026</span>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
