"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Languages,
  PhoneCall,
  Sparkles,
  Target,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CurriculumModule = {
  title: string;
  topics: readonly string[];
};

type CourseCategory = "all" | "neet" | "tamil" | "jee" | "mock" | "pyq" | "sprint";

type Course = {
  id: string;
  title: string;
  category: CourseCategory;
  categoryLabel: string;
  targetAudience: string;
  eyebrow: string;
  duration: string;
  language: string;
  icon: LucideIcon;
  accent: "red" | "blue";
  featured?: boolean;
  batchStatus: string;
  description: string;
  deliverables: readonly string[];
  curriculumModules: readonly CurriculumModule[];
  highlights: readonly string[];
};

const courses: readonly Course[] = [
  {
    id: "neet-full-course",
    title: "Complete NEET Academic Accelerator",
    category: "neet",
    categoryLabel: "NEET Comprehensive",
    targetAudience: "Class 11, 12 & Repeater Aspirants",
    eyebrow: "Flagship Year-Long Batch",
    duration: "12 Months · 700+ Lecture Hrs",
    language: "Bilingual (தமிழ் + English)",
    icon: BookOpenCheck,
    accent: "red",
    featured: true,
    batchStatus: "Batch 2026 Admissions Active",
    description:
      "Comprehensive NCERT line-by-line mastery across Physics, Chemistry, Botany, and Zoology with daily timed DPPs, weekly 720-mark simulated tests, and dedicated 1-on-1 faculty mentoring.",
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
    highlights: [
      "NCERT Line-by-Line Complete Syllabus",
      "Physical Study Modules & Formula Flashcards",
      "60+ Unit & Full Cumulative Tests",
      "Daily Timed DPP Leaderboard",
    ],
  },
  {
    id: "tamil-batch",
    title: "NEET Tamil Medium Foundation",
    category: "tamil",
    categoryLabel: "Tamil Medium Core",
    targetAudience: "TN State Board & Tamil Medium Students",
    eyebrow: "State Board to NCERT Bridge",
    duration: "Full Year · Live + Recorded",
    language: "தமிழ் Medium Core",
    icon: Languages,
    accent: "blue",
    batchStatus: "Limited Seats Available",
    description:
      "Specialized program enabling Tamil medium students to master NCERT concepts with clear, intuitive Tamil explanations while building effortless fluency in standard English scientific terms.",
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
    highlights: [
      "Dual-Language Study Modules with Tamil Annotations",
      "Daily 1-on-1 Tamil Faculty Doubt Sessions",
      "State Board Bridge Course Before Advanced Topics",
      "Confidence-Building Mentorship by Past Tamil-Medium Rankers",
    ],
  },
  {
    id: "jee-accelerator",
    title: "JEE Main & Advanced Accelerator",
    category: "jee",
    categoryLabel: "Engineering Batch",
    targetAudience: "Class 11, 12 & Droppers (Engineering)",
    eyebrow: "IIT & NIT Target Batch",
    duration: "12 Months · 300+ Practice Sets",
    language: "Bilingual (தமிழ் + English)",
    icon: BrainCircuit,
    accent: "blue",
    batchStatus: "Batch 2026 Admissions Open",
    description:
      "Rigorous problem-solving, advanced calculus, and multi-concept question mastery engineered for top percentile ranks in JEE Main and IIT JEE Advanced.",
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
        title: "JEE Physics Mastery",
        topics: [
          "Rotational Dynamics & Conservation Laws",
          "Electromagnetism & Wave Optics",
          "Modern Quantum Physics & Semiconductors",
          "Thermodynamics & Kinetic Theory",
        ],
      },
      {
        title: "JEE Chemistry Mastery",
        topics: [
          "Physical Chemistry Thermodynamics & Kinetics",
          "Advanced Organic Mechanisms & Stereochemistry",
          "Coordination Chemistry & Qualitative Analysis",
          "Electrochemistry & Equilibrium Numericals",
        ],
      },
    ],
    highlights: [
      "Authentic NTA Computer-Based Test (CBT) Interface",
      "IITian Faculty Mentors & Problem Clinics",
      "Archive of Advanced Multi-Step Subjective Problems",
      "Percentile Benchmarking with Rank Telemetry",
    ],
  },
  {
    id: "neet-mock-tests",
    title: "All-India Simulated Mock Test Series",
    category: "mock",
    categoryLabel: "Mock Series",
    targetAudience: "Exam-Year Aspirants (NEET & JEE 2026)",
    eyebrow: "NTA Calibrated Simulation",
    duration: "25 Full Tests · 60 Unit Tests",
    language: "English & தமிழ்",
    icon: FileCheck2,
    accent: "red",
    batchStatus: "Batch Filling Fast",
    description:
      "Full-length simulated exams strictly calibrated to exact NTA difficulty with real-time countdown timer, Section A/B optional patterns, and sub-topic diagnostic percentile rank radar.",
    deliverables: [
      "25 Full-length 720-mark / 300-mark simulated exam papers",
      "Printable OMR answer sheets + Authentic CBT online test platform",
      "Real-time All-India Percentile & sub-topic negative-mark radar",
      "Instant bilingual video solutions with shortcut tricks for every question",
    ],
    curriculumModules: [
      {
        title: "Testing Phases",
        topics: [
          "Phase 1: 40 Chapter-Wise Topical Drills",
          "Phase 2: 20 Semi-Cumulative Unit Tests",
          "Phase 3: 15 High-Yield Sectional Simulations",
          "Phase 4: 10 Grand All-India Open Mocks",
        ],
      },
      {
        title: "Diagnostic Telemetry",
        topics: [
          "Time Spent Per Question (Speed vs Accuracy)",
          "Sub-Topic Negative Mark Identification",
          "Guesswork & Distractor Trap Vulnerability Index",
          "Projected All-India Rank (AIR) Predictor",
        ],
      },
    ],
    highlights: [
      "OMR Sheet Courier Option for Real Exam Hall Feel",
      "Bilingual Video Solutions for 100% of Questions",
      "Benchmarked Against 15,000+ Active Aspirants",
      "Instant Weak-Topic Mistake List Generated After Each Test",
    ],
  },
  {
    id: "pyq-practice",
    title: "15-Year Topic-Wise PYQ Mastery Bank",
    category: "pyq",
    categoryLabel: "Question Bank",
    targetAudience: "Self-Paced Practice & Repeater Aspirants",
    eyebrow: "Pattern Analytics & Traps",
    duration: "3,500+ Solved Questions",
    language: "English & தமிழ்",
    icon: Sparkles,
    accent: "blue",
    batchStatus: "Instant Portal Access",
    description:
      "Exhaustive topic-wise collection of past 15 years' questions (2010–2025) revealing recurring NTA examiner patterns, trap options, and rapid mental elimination techniques.",
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
    highlights: [
      "Generate Unlimited Custom Tests from Filtered PYQs",
      "Bilingual Audio-Visual Solutions in தமிழ் + English",
      "Downloadable & Printable Topic-Wise Question Worksheets",
      "Bookmarked 'Mistake Vault' for Repeated Practice",
    ],
  },
  {
    id: "revision-tests",
    title: "Final 30-Day High-Yield Sprint",
    category: "sprint",
    categoryLabel: "Quick Revision",
    targetAudience: "Final 30-45 Days Before Examination",
    eyebrow: "Last-Mile Score Maximizer",
    duration: "30-Day Intensive Sprint",
    language: "Bilingual (தமிழ் + English)",
    icon: Clock3,
    accent: "red",
    batchStatus: "Pre-Registration Active",
    description:
      "High-impact fast-track revision capsules targeting the top 100 highest-weightage topics, formula cheat sheets, and 45-minute timed reflex drills.",
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
    highlights: [
      "40+ Laminated Formula Sheets & Organic Reaction Flowcharts",
      "5 Full-Length Grand Finale All-India Mocks",
      "Daily Evening Rapid Doubt Clearing Rooms",
      "Stress Management & Final Week Score Optimization Strategies",
    ],
  },
];

const filterTabs: readonly { id: CourseCategory; label: string }[] = [
  { id: "all", label: "All Curriculums" },
  { id: "neet", label: "NEET Comprehensive" },
  { id: "tamil", label: "Tamil Medium" },
  { id: "jee", label: "JEE Engineering" },
  { id: "mock", label: "Mock Series" },
  { id: "pyq", label: "PYQ Bank" },
  { id: "sprint", label: "Crash Sprint" },
];

export function AvailableCourses() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<CourseCategory>("all");
  const [activeModalCourse, setActiveModalCourse] = useState<Course | null>(null);
  const [activeEnrollCourse, setActiveEnrollCourse] = useState<Course | null>(null);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    targetYear: "2026",
    stream: "NEET",
  });

  const filteredCourses =
    selectedFilter === "all"
      ? courses
      : courses.filter((c) => c.category === selectedFilter);

  function handleEnrollClick(course: Course) {
    setActiveEnrollCourse(course);
    setEnquirySuccess(false);
    setFormData((prev) => ({
      ...prev,
      stream: course.category === "jee" ? "JEE" : "NEET",
    }));
  }

  function handleEnquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnquirySuccess(true);
  }

  return (
    <section
      id="courses"
      aria-labelledby="available-courses-title"
      className="relative overflow-hidden bg-white border-b border-slate-200/80 px-4 py-12 sm:px-8 sm:py-16 lg:py-20"
    >
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header & Filter Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-[#e51d35]">
              <GraduationCap className="size-3.5 text-[#e51d35]" aria-hidden="true" />
              <span>Curated Academic Programs</span>
            </div>
            <h2
              id="available-courses-title"
              className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-[32px]"
            >
              Academic Programs &amp; Test Series
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Purpose-built preparation for NEET &amp; JEE with guided practice, verified NTA pattern rigor, and dual-language clarity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-4 py-1.5 text-xs shadow-2xs self-start sm:self-auto">
            <span className="flex items-center gap-2 font-semibold text-slate-700">
              <Users className="size-3.5 text-[#2525b8]" />
              <span>Batch 2026 Enrolment Active</span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                  isSelected
                    ? "bg-[#2525b8] text-white shadow-xs font-semibold"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Courses Grid: Balanced 3-Column Layout */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const Icon = course.icon;
            const isBlue = course.accent === "blue";

            return (
              <article
                key={course.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:shadow-md sm:p-6",
                  course.featured && "border-slate-300/90 bg-gradient-to-br from-white via-slate-50/30 to-slate-50/60",
                )}
              >
                {/* Top Colored Accent Strip */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl",
                    isBlue ? "bg-[#2525b8]" : "bg-[#e51d35]",
                  )}
                />

                <div className="flex flex-col justify-between h-full pt-1">
                  <div>
                    {/* Header Badges: Eyebrow + Language & Icon */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-3xs font-bold tracking-wider uppercase",
                              isBlue
                                ? "bg-blue-50 text-[#2525b8] border border-blue-200"
                                : "bg-rose-50 text-[#e51d35] border border-rose-200",
                            )}
                          >
                            {course.categoryLabel}
                          </span>
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-3xs font-medium text-slate-700">
                            {course.language}
                          </span>
                        </div>
                        <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400">
                          {course.eyebrow}
                        </p>
                      </div>

                      <div
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl shadow-2xs transition-transform duration-200 group-hover:scale-105",
                          isBlue
                            ? "bg-blue-50 text-[#2525b8]"
                            : "bg-rose-50 text-[#e51d35]",
                        )}
                      >
                        <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                      </div>
                    </div>

                    {/* Title, Target Audience & Duration */}
                    <div className="mt-3.5">
                      <h3 className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-slate-950 sm:text-xl leading-snug">
                        {course.title}
                      </h3>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/90 px-2 py-0.5 text-3xs font-medium text-slate-600">
                          <Target className="size-3 text-slate-400 shrink-0" />
                          <span>{course.targetAudience}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-200/90 px-2 py-0.5 text-3xs font-medium text-slate-600">
                          <Clock3 className="size-3 text-slate-400 shrink-0" />
                          <span>{course.duration}</span>
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {course.description}
                      </p>
                    </div>

                    {/* Inclusions / Deliverables */}
                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      <p className="text-3xs font-bold tracking-wider text-slate-500 uppercase">
                        Included in curriculum:
                      </p>
                      <ul className="space-y-1.5">
                        {course.deliverables.map((item) => (
                          <li key={item} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                            <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {course.batchStatus}
                    </span>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveModalCourse(course)}
                        className="cursor-pointer text-xs h-9 px-3 border-slate-300 hover:bg-slate-100 font-medium"
                      >
                        Syllabus Details
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleEnrollClick(course)}
                        className={cn(
                          "cursor-pointer text-xs h-9 px-3.5 gap-1.5 text-white border-0 shadow-xs font-medium",
                          isBlue
                            ? "bg-[#2525b8] hover:bg-[#1a187a]"
                            : "bg-[#e51d35] hover:bg-[#c41328]",
                        )}
                      >
                        Enroll Now
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Syllabus Modal */}
      {activeModalCourse && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-semibold text-[#2525b8] uppercase">
                    {activeModalCourse.categoryLabel}
                  </span>
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {activeModalCourse.language}
                  </span>
                </div>
                <h3 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">
                  {activeModalCourse.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Target: {activeModalCourse.targetAudience} · {activeModalCourse.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalCourse(null)}
                className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {activeModalCourse.description}
            </p>

            {/* Curriculum Breakdown */}
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Curriculum Structure &amp; Subject Modules:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeModalCourse.curriculumModules.map((module) => (
                  <div
                    key={module.title}
                    className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs"
                  >
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-[#2525b8]" />
                      <span>{module.title}</span>
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-600">
                      {module.topics.map((topic) => (
                        <li key={topic} className="flex items-start gap-1.5 leading-snug">
                          <span className="size-1 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Deliverables & Specifications */}
            <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200/80 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Key Inclusions &amp; Deliverables:
              </h4>
              <ul className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                {activeModalCourse.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <PhoneCall className="size-3.5 text-[#e51d35]" />
                <span>Helpline: <strong>+91 94422 00000</strong></span>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModalCourse(null)}
                  className="cursor-pointer text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const c = activeModalCourse;
                    setActiveModalCourse(null);
                    handleEnrollClick(c);
                  }}
                  className="cursor-pointer text-xs bg-[#2525b8] hover:bg-[#1a187a] text-white"
                >
                  Proceed to Enrolment
                  <ArrowUpRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admission / Enrolment Modal */}
      {activeEnrollCourse && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-3xs font-bold uppercase tracking-wider text-emerald-700">
                  Admissions 2026 Active
                </span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  Enrol in {activeEnrollCourse.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activeEnrollCourse.language} · {activeEnrollCourse.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveEnrollCourse(null)}
                className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
                <h4 className="mt-3 text-sm font-bold text-emerald-900">
                  Admission Request Received
                </h4>
                <p className="mt-1.5 text-xs text-emerald-700 leading-relaxed">
                  Thank you! Our senior academic counselor will call you within 2 business hours with course syllabus, batch schedule, and fee details.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setActiveEnrollCourse(null)}
                    className="cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
                  >
                    Done
                  </Button>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="cursor-pointer text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Go to Student LMS Login →
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="mt-5 space-y-3.5">
                <div>
                  <label htmlFor="student-name" className="block text-xs font-semibold text-slate-700">
                    Student Full Name
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    required
                    placeholder="Enter student name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="student-phone" className="block text-xs font-semibold text-slate-700">
                    Parent / Student Mobile Number
                  </label>
                  <input
                    id="student-phone"
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="target-year" className="block text-xs font-semibold text-slate-700">
                      Target Exam Year
                    </label>
                    <select
                      id="target-year"
                      value={formData.targetYear}
                      onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                    >
                      <option value="2026">2026 Batch</option>
                      <option value="2027">2027 Batch</option>
                      <option value="Repeater">Dropper / Repeater</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="stream" className="block text-xs font-semibold text-slate-700">
                      Stream
                    </label>
                    <select
                      id="stream"
                      value={formData.stream}
                      onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                    >
                      <option value="NEET">NEET Medical</option>
                      <option value="JEE">JEE Engineering</option>
                      <option value="Tamil-Medium">Tamil Medium</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-3xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <PhoneCall className="size-3 text-[#e51d35]" />
                    <span>Admissions Hotline:</span>
                  </span>
                  <a href="tel:+919442200000" className="font-bold text-slate-900 hover:underline">
                    +91 94422 00000
                  </a>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveEnrollCourse(null)}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="cursor-pointer text-xs bg-[#2525b8] hover:bg-[#1a187a] text-white"
                  >
                    Submit Enrolment Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
