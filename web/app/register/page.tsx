"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Languages,
  LoaderCircle,
  Mail,
  Phone,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const academicPillars = [
  {
    title: "Calibrated NTA Pedagogy",
    desc: "Strict alignment with latest NTA syllabus and high-yield question patterns.",
  },
  {
    title: "Bilingual தமிழ் + English Clarity",
    desc: "Native intuitive explanations paired with standard scientific terminology.",
  },
  {
    title: "Daily DPP & Diagnostic Telemetry",
    desc: "15 timed drills every day with weak-area detection and doubt resolution.",
  },
] as const;

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [oauthError, setOauthError] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
  }>({});

  const [formData, setFormData] = useState({
    studentName: "",
    mobileNumber: "",
    email: "",
    academicProgram: "Complete NEET Academic Accelerator",
    targetYear: "2026",
    instructionLanguage: "Bilingual (தமிழ் + English)",
  });

  function validate() {
    const errors: { name?: string; phone?: string; email?: string } = {};
    const cleanName = formData.studentName.trim();
    if (!cleanName) {
      errors.name = "Enter student full name.";
    } else if (cleanName.length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    const cleanPhone = formData.mobileNumber.replace(/\D/g, "");
    if (!cleanPhone) {
      errors.phone = "Enter 10-digit mobile number.";
    } else if (cleanPhone.length !== 10) {
      errors.phone = "Please enter full 10-digit mobile number.";
    } else if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      errors.phone = "Must start with 6, 7, 8, or 9.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email.trim())
    ) {
      errors.email = "Enter a valid email address (e.g. name@example.com).";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  }

  const inputBaseStyle =
    "h-10.5 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs sm:text-sm font-normal text-slate-900 shadow-2xs transition-colors outline-hidden placeholder:text-slate-400 hover:border-slate-400 focus:border-brand-blue focus:ring-3 focus:ring-brand-blue/15 aria-invalid:border-rose-500 aria-invalid:ring-3 aria-invalid:ring-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex min-h-svh flex-col bg-slate-50/70 font-sans text-slate-900 selection:bg-brand-red selection:text-white antialiased lg:h-svh lg:overflow-hidden">
      {/* 01. NAVIGATION HEADER (h-16, max-w-6xl aligned with main content & homepage) */}
      <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <BrandLogo priority className="h-8.5 sm:h-9.5 w-auto" />
            <span
              className="hidden h-5 w-px bg-slate-200 sm:block"
              aria-hidden="true"
            />
            {/* Dual instruction capsule */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-2xs">
              <span className="size-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="font-bold text-slate-900">தமிழ்</span>
              <span className="text-slate-400">+</span>
              <span className="font-bold text-slate-900">English</span>
              <span className="h-2 w-px bg-slate-200" aria-hidden="true" />
              <span className="text-slate-500">Admissions 2026</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back to Academy</span>
            </Link>
            <span className="h-3.5 w-px bg-slate-200" aria-hidden="true" />
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-blue transition hover:bg-blue-100 hover:border-blue-300"
            >
              <span>Student Sign In</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 02. MAIN CONTENT AREA - Fitted for laptop screen */}
      <main className="relative flex flex-1 items-center justify-center overflow-y-auto px-4 py-3 sm:px-8 lg:overflow-hidden lg:py-0 min-h-0">
        <div className="relative mx-auto max-w-6xl w-full">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-10">
            {/* Left Column: Academic Benefits & Helpline */}
            <div className="flex flex-col justify-between lg:col-span-5">
              <div>
                {/* Eyebrow badge */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-brand-red uppercase shadow-2xs">
                    <GraduationCap className="size-3.5 text-brand-red" />
                    <span>Cohort 2026 Admissions Open</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-brand-blue">
                    <Sparkles className="size-3" />
                    Limited Seats
                  </span>
                </div>

                <h1 className="mt-2.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-3xl leading-tight">
                  Student Enrolment &amp; Admissions
                </h1>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Join hundreds of aspiring doctors and engineers in our calibrated bilingual
                  NEET &amp; JEE learning ecosystem.
                </p>

                {/* Academic Highlights */}
                <div className="mt-3.5 space-y-2">
                  {academicPillars.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 shadow-2xs backdrop-blur-xs transition hover:border-slate-300"
                    >
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate sm:text-clip">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Academic Helpline Card */}
              <div className="mt-4 rounded-xl bg-brand-navy text-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase font-semibold tracking-wider text-slate-300">
                    Immediate Academic Helpline
                  </p>
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-lg bg-white/10 text-white shadow-2xs">
                    <PhoneCall className="size-4 text-brand-red" />
                  </div>
                  <div>
                    <a
                      href="tel:+919894850370"
                      className="text-sm font-bold text-white hover:text-rose-200 transition"
                    >
                      +91 98948 50370 / +91 81482 17151
                    </a>
                    <p className="text-xs text-slate-300">
                      Coimbatore Campus · Mon - Sat (9 AM - 6 PM), Sun (9 AM - 4 PM)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Admission Form */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-4.5 sm:p-5.5 lg:p-6 shadow-card">
              {submitted ? (
                /* Success View */
                <div className="py-4 text-center animate-in fade-in-50 duration-300">
                  <div className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs">
                    <CheckCircle2 className="size-7" />
                  </div>
                  <h2 className="mt-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                    Application Successfully Registered!
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 max-w-md mx-auto sm:text-sm">
                    Thank you, <strong className="text-slate-900">{formData.studentName}</strong>.
                    We have reserved your application for{" "}
                    <strong className="text-brand-blue">{formData.academicProgram}</strong> ({formData.targetYear}).
                  </p>

                  <div className="mt-3.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left max-w-md mx-auto text-xs space-y-1.5">
                    <p className="font-bold text-slate-900">What happens next?</p>
                    <ul className="space-y-1 text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-brand-blue" />
                        Our counselor will call your mobile (<strong>{formData.mobileNumber}</strong>) within 24 working hours.
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-brand-blue" />
                        Free bilingual Diagnostic Benchmark Assessment schedule shared on WhatsApp.
                      </li>
                    </ul>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Link
                      href="/"
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Return to Homepage
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-full bg-brand-red hover:bg-brand-red-hover px-5 py-2 text-xs font-semibold text-white shadow-primary transition"
                    >
                      Go to Student LMS Login
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        studentName: "",
                        mobileNumber: "",
                        email: "",
                        academicProgram: "Complete NEET Academic Accelerator",
                        targetYear: "2026",
                        instructionLanguage: "Bilingual (தமிழ் + English)",
                      });
                    }}
                    className="mt-3 block mx-auto text-xs font-medium text-slate-400 hover:text-slate-600 transition"
                  >
                    Register another student
                  </button>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3" noValidate>
                  {/* Top Card Badge */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-brand-red uppercase">
                      <ShieldCheck className="size-3.5 text-brand-red" />
                      <span>Direct Admission 2026</span>
                    </div>
                    <span className="text-xs font-medium text-slate-400">Step 1 of 1</span>
                  </div>

                  <div>
                    <h2 className="mt-1 text-lg font-extrabold text-slate-900 sm:text-xl">
                      Academic Enrolment Form
                    </h2>
                    <p className="text-xs text-slate-500">
                      Enter details below to register for the upcoming batch.
                    </p>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-2.5">
                    <GoogleSignInButton
                      label="Register with Google"
                      onError={setOauthError}
                      className="bg-white"
                    />
                    <p className="mt-1.5 text-center text-xs leading-relaxed text-slate-500">
                      Creates your secure LMS identity. Internal student emails receive free access automatically; other accounts use a paid plan.
                    </p>
                    {oauthError && (
                      <p role="alert" className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                        <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                        <span>{oauthError}</span>
                      </p>
                    )}
                  </div>

                  <div className="relative text-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      or register with details
                    </span>
                  </div>

                  {/* Row 1: Full Name & Phone */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="reg-name"
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Student Full Name *
                      </label>
                      <div className="relative">
                        <input
                          id="reg-name"
                          type="text"
                          required
                          placeholder="e.g. K. Vignesh"
                          value={formData.studentName}
                          onChange={(e) => {
                            // Only allow letters, spaces, dots and hyphens
                            const clean = e.target.value.replace(/[^a-zA-Z\s.-]/g, "");
                            setFormData({ ...formData, studentName: clean });
                            if (clean.trim().length >= 2) {
                              setFormErrors((prev) => ({ ...prev, name: undefined }));
                            }
                          }}
                          onBlur={() => {
                            if (!formData.studentName.trim()) {
                              setFormErrors((prev) => ({ ...prev, name: "Student full name is required." }));
                            } else if (formData.studentName.trim().length < 2) {
                              setFormErrors((prev) => ({ ...prev, name: "Name must be at least 2 characters." }));
                            }
                          }}
                          className={cn(
                            inputBaseStyle,
                            "pl-8.5",
                            formErrors.name && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                          )}
                        />
                        <User
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                      {formErrors.name && (
                        <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{formErrors.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor="reg-phone"
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Mobile Number *
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="reg-phone"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel-national"
                          required
                          maxLength={10}
                          placeholder="98765 43210"
                          value={formData.mobileNumber}
                          onKeyDown={(e) => {
                            // Allow navigation & control keys
                            if (
                              e.key === "Backspace" ||
                              e.key === "Tab" ||
                              e.key === "Enter" ||
                              e.key === "Delete" ||
                              e.key === "ArrowLeft" ||
                              e.key === "ArrowRight" ||
                              e.ctrlKey ||
                              e.metaKey
                            ) {
                              return;
                            }
                            // Prevent any key that is not a numeric digit (0-9)
                            if (!/^[0-9]$/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            // Strip any non-digit characters strictly and cap to 10 digits
                            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setFormData({ ...formData, mobileNumber: digitsOnly });

                            if (digitsOnly.length === 10) {
                              if (!/^[6-9]/.test(digitsOnly)) {
                                setFormErrors((prev) => ({
                                  ...prev,
                                  phone: "Must start with 6, 7, 8, or 9.",
                                }));
                              } else {
                                setFormErrors((prev) => ({ ...prev, phone: undefined }));
                              }
                            } else if (digitsOnly.length > 0 && !/^[6-9]/.test(digitsOnly)) {
                              setFormErrors((prev) => ({
                                ...prev,
                                phone: "Must start with 6, 7, 8, or 9.",
                              }));
                            } else {
                              setFormErrors((prev) => ({ ...prev, phone: undefined }));
                            }
                          }}
                          onBlur={() => {
                            if (!formData.mobileNumber) {
                              setFormErrors((prev) => ({ ...prev, phone: "Mobile number is required." }));
                            } else if (formData.mobileNumber.length !== 10) {
                              setFormErrors((prev) => ({
                                ...prev,
                                phone: "Enter full 10-digit mobile number.",
                              }));
                            } else if (!/^[6-9][0-9]{9}$/.test(formData.mobileNumber)) {
                              setFormErrors((prev) => ({
                                ...prev,
                                phone: "Must start with 6, 7, 8, or 9.",
                              }));
                            }
                          }}
                          className={cn(
                            inputBaseStyle,
                            "pl-17",
                            formErrors.phone && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                          )}
                        />
                        <div className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 text-slate-400">
                          <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                          <span className="text-xs sm:text-sm font-semibold text-slate-600 border-r border-slate-200 pr-1.5">+91</span>
                        </div>
                      </div>
                      {formErrors.phone && (
                        <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{formErrors.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Email & Academic Program */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        htmlFor="reg-email"
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Email <span className="font-normal text-slate-400">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          id="reg-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="student@example.com"
                          value={formData.email}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setFormData({ ...formData, email: val });
                            setFormErrors((prev) => ({ ...prev, email: undefined }));
                          }}
                          onBlur={() => {
                            if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
                              setFormErrors((prev) => ({
                                ...prev,
                                email: "Enter a valid email address.",
                              }));
                            }
                          }}
                          className={cn(
                            inputBaseStyle,
                            "pl-8.5",
                            formErrors.email && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                          )}
                        />
                        <Mail
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                          aria-hidden="true"
                        />
                      </div>
                      {formErrors.email && (
                        <p className="flex items-center gap-1 text-xs font-medium text-rose-600">
                          <AlertCircle className="size-3.5 shrink-0" />
                          <span>{formErrors.email}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Academic Program *
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.academicProgram}
                          onValueChange={(val) =>
                            setFormData((prev) => ({ ...prev, academicProgram: val ?? "" }))
                          }
                        >
                          <SelectTrigger
                            id="reg-program"
                            className={cn(
                              inputBaseStyle,
                              "pl-8.5 pr-3 cursor-pointer text-left"
                            )}
                          >
                            <SelectValue placeholder="Select Academic Program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Complete NEET Academic Accelerator">
                              Complete NEET Accelerator (12M)
                            </SelectItem>
                            <SelectItem value="NEET Tamil Medium Foundation">
                              NEET Tamil Medium Foundation
                            </SelectItem>
                            <SelectItem value="JEE Main & Advanced Accelerator">
                              JEE Main &amp; Advanced Accelerator
                            </SelectItem>
                            <SelectItem value="All-India Simulated Mock Test Series">
                              All-India Mock Test Series (25 Mocks)
                            </SelectItem>
                            <SelectItem value="15-Year Topic-Wise PYQ Mastery Bank">
                              15-Year PYQ Mastery Bank
                            </SelectItem>
                            <SelectItem value="Final 30-Day High-Yield Sprint">
                              Final 30-Day High-Yield Sprint
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <BookOpen
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 z-10"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Target Year & Language Preference */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Target Examination Year
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.targetYear}
                          onValueChange={(val) =>
                            setFormData((prev) => ({ ...prev, targetYear: val ?? "" }))
                          }
                        >
                          <SelectTrigger
                            id="reg-year"
                            className={cn(
                              inputBaseStyle,
                              "pl-8.5 pr-3 cursor-pointer text-left"
                            )}
                          >
                            <SelectValue placeholder="Target Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2026">2026 Cohort</SelectItem>
                            <SelectItem value="2027">2027 Cohort</SelectItem>
                            <SelectItem value="Repeater / Dropper">Repeater / Dropper Batch</SelectItem>
                          </SelectContent>
                        </Select>
                        <Calendar
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 z-10"
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label
                        className="block text-xs sm:text-sm font-semibold text-slate-700"
                      >
                        Instruction Language
                      </label>
                      <div className="relative">
                        <Select
                          value={formData.instructionLanguage}
                          onValueChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              instructionLanguage: val ?? "",
                            }))
                          }
                        >
                          <SelectTrigger
                            id="reg-lang"
                            className={cn(
                              inputBaseStyle,
                              "pl-8.5 pr-3 cursor-pointer text-left"
                            )}
                          >
                            <SelectValue placeholder="Instruction Language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bilingual (தமிழ் + English)">
                              Bilingual (தமிழ் + English)
                            </SelectItem>
                            <SelectItem value="தமிழ் Medium Core">
                              தமிழ் Medium Core
                            </SelectItem>
                            <SelectItem value="English Medium">
                              English Medium
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Languages
                          className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400 z-10"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-1">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-10.5 w-full cursor-pointer rounded-full bg-brand-red hover:bg-brand-red-hover text-xs sm:text-sm font-semibold text-white shadow-primary transition hover:shadow-md active:scale-95 disabled:opacity-60"
                    >
                      {isSubmitting && (
                        <LoaderCircle className="size-3.5 animate-spin mr-2" />
                      )}
                      <span>
                        {isSubmitting
                           ? "Submitting Enrolment…"
                          : "Complete Admission Registration"}
                      </span>
                    </Button>
                    <p className="mt-1.5 text-center text-xs text-slate-500">
                      By registering, you agree to receive academic updates &amp; guidance from I-Sharp Academy.
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="relative my-2 text-center">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <span className="relative bg-white px-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Already Enrolled?
                    </span>
                  </div>

                  {/* Link to Login */}
                  <Link
                    href="/login"
                    className="group flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/50 px-3 py-2 transition hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-brand-blue text-white shadow-2xs">
                        <Users className="size-3.5" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-brand-blue transition">
                          Access Student LMS Portal
                        </p>
                        <p className="text-xs text-slate-500">
                          Sign in with your registered email or mobile
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue" />
                  </Link>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
