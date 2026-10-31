"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, GraduationCap, PhoneCall, ShieldCheck, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    mobileNumber: "",
    email: "",
    academicProgram: "Complete NEET Academic Accelerator",
    targetYear: "2026",
    instructionLanguage: "Bilingual (தமிழ் + English)",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="flex min-h-svh flex-col bg-slate-50 font-sans text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-8">
          <BrandLogo priority />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Academy</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 py-10 px-4 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Academic Benefits */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-3xs font-bold tracking-wider text-[#e51d35] uppercase">
                  <GraduationCap className="size-3.5 text-[#e51d35]" />
                  <span>Cohort 2026 Admissions Open</span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Student Enrolment &amp; Admissions
                </h1>
                <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  Join hundreds of aspiring doctors and engineers in our rigorous bilingual learning ecosystem.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Calibrated NTA Pedagogy</p>
                      <p className="text-slate-500 mt-0.5">Strict alignment with latest NTA syllabus and difficulty patterns.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Bilingual தமிழ் + English Clarity</p>
                      <p className="text-slate-500 mt-0.5">Native intuitive explanations with international scientific rigor.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Daily DPP &amp; Diagnostic Telemetry</p>
                      <p className="text-slate-500 mt-0.5">Automated weak-area detection and personalized doubt clearing.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Helpline Card */}
              <div className="mt-6 rounded-2xl bg-[#191747] text-white p-5 shadow-sm">
                <p className="text-3xs uppercase font-bold tracking-wider text-slate-300">
                  Immediate Academic Assistance
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-lg bg-white/10 text-white">
                    <PhoneCall className="size-4.5 text-[#e51d35]" />
                  </div>
                  <div>
                    <a href="tel:+919442200000" className="text-sm font-bold hover:underline">
                      +91 94422 00000
                    </a>
                    <p className="text-3xs text-slate-400">Monday - Saturday (9:00 AM - 7:00 PM)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Admission Form */}
            <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
              {submitted ? (
                <div className="py-8 text-center">
                  <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
                    <CheckCircle2 className="size-8" />
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-slate-900">
                    Application Successfully Registered
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 max-w-md mx-auto">
                    We have received your details for <strong>{formData.academicProgram}</strong>. Our senior academic counselor will connect with you via mobile number ({formData.mobileNumber}) to guide you through batch orientation.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Return to Homepage
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-xl bg-[#2525b8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1a187a]"
                    >
                      Access Student LMS Portal
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Academic Enrolment Form
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Please enter your contact details to register for the 2026/2027 academic batch.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700">
                        Student Full Name *
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        required
                        placeholder="e.g. K. Vignesh"
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                          Mobile Number *
                        </label>
                        <input
                          id="reg-phone"
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          placeholder="10-digit mobile number"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                          Email Address
                        </label>
                        <input
                          id="reg-email"
                          type="email"
                          placeholder="student@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-program" className="block text-xs font-semibold text-slate-700">
                        Academic Program *
                      </label>
                      <select
                        id="reg-program"
                        value={formData.academicProgram}
                        onChange={(e) => setFormData({ ...formData, academicProgram: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                      >
                        <option value="Complete NEET Academic Accelerator">Complete NEET Academic Accelerator (12 Months)</option>
                        <option value="NEET Tamil Medium Foundation">NEET Tamil Medium Foundation (State Board Bridge)</option>
                        <option value="JEE Main & Advanced Accelerator">JEE Main &amp; Advanced Accelerator (Engineering)</option>
                        <option value="All-India Simulated Mock Test Series">All-India Simulated Mock Test Series (25 Mocks + 60 Unit Tests)</option>
                        <option value="15-Year Topic-Wise PYQ Mastery Bank">15-Year Topic-Wise PYQ Mastery Bank (3,500+ Solved)</option>
                        <option value="Final 30-Day High-Yield Sprint">Final 30-Day High-Yield Sprint (Crash Course)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-year" className="block text-xs font-semibold text-slate-700">
                          Target Year
                        </label>
                        <select
                          id="reg-year"
                          value={formData.targetYear}
                          onChange={(e) => setFormData({ ...formData, targetYear: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                        >
                          <option value="2026">2026 Cohort</option>
                          <option value="2027">2027 Cohort</option>
                          <option value="Repeater">Dropper / Repeater</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="reg-lang" className="block text-xs font-semibold text-slate-700">
                          Language Preference
                        </label>
                        <select
                          id="reg-lang"
                          value={formData.instructionLanguage}
                          onChange={(e) => setFormData({ ...formData, instructionLanguage: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-[#2525b8] focus:outline-hidden"
                        >
                          <option value="Bilingual (தமிழ் + English)">Bilingual (தமிழ் + English)</option>
                          <option value="தமிழ் Medium Core">தமிழ் Medium Core</option>
                          <option value="English Medium">English Medium</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3">
                    <Button
                      type="submit"
                      className="w-full h-10 cursor-pointer bg-[#2525b8] hover:bg-[#1a187a] text-white text-xs font-semibold shadow-xs"
                    >
                      Complete Admission Registration
                    </Button>
                    <p className="mt-2.5 text-center text-3xs text-slate-400">
                      By registering, you agree to receive academic updates &amp; counselling guidance from I-Sharp Academy.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

