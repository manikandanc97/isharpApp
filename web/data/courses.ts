import {
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  FileCheck2,
  Languages,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type CurriculumModule = {
  title: string;
  topics: readonly string[];
};

export type Course = {
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

export const courses: readonly Course[] = [
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

