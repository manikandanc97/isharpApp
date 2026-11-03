import Link from "next/link";
import { ApiConnectionStatus } from "@/components/api-connection-status";
import { BrandLogo } from "@/components/brand-logo";
import {
  CheckCircle2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950 text-white">
      {/* Editorial Luxury Quote Bar */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 text-center sm:px-8 md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-amber-400/10 text-amber-300 border border-amber-400/20 shadow-2xs">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                &ldquo;Consistency beats intensity. When practice becomes reflex, rank becomes inevitable.&rdquo;
              </p>
              <p className="text-xs text-slate-400">
                — I-Sharp Academic Directorate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3.5 py-1 text-xs text-slate-300">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span>NTA Calibrated Curriculum Standard</span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="inline-block rounded-xl bg-white p-2.5 shadow-sm">
              <BrandLogo />
            </div>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-slate-400 sm:text-sm">
              Premier NEET, IIT-JEE &amp; MBA Entrance coaching centre in Coimbatore.
              Empowering students with disciplined pedagogy, separate Tamil Medium foundation batches,
              calibrated test series, and personalized one-on-one doubt clearance.
            </p>
            <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <Phone className="size-4 text-brand-red shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span>Helpline: <a href="tel:+919894850370" className="hover:text-white font-medium">+91 98948 50370</a> / <a href="tel:+918148217151" className="hover:text-white font-medium">+91 81482 17151</a></span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-blue-400 shrink-0" />
                <a href="mailto:isharpacademy@gmail.com" className="hover:text-white">isharpacademy@gmail.com</a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-brand-red shrink-0 mt-0.5" />
                <span className="leading-snug">
                  2nd Floor, AK Complex, No.207, 6th Street, Cross Cut Rd, Gandhipuram, Coimbatore – 641012, Tamil Nadu
                </span>
              </div>
            </div>

            {/* Enterprise Security Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
                <Lock className="size-3 text-emerald-400" /> 256-Bit TLS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
                <CheckCircle2 className="size-3 text-blue-400" /> ISO 9001:2015
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-400">
                <ShieldCheck className="size-3 text-amber-400" /> NTA Aligned
              </span>
            </div>
          </div>

          {/* Column 1: Academic Programs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Academic Curriculums
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#courses" className="hover:text-white transition">
                  NEET Classroom &amp; Distance Prep
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition">
                  NEET Tamil Medium Foundation
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition">
                  IIT-JEE Main &amp; Advanced
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition">
                  NEET All-India Test Series (AITS)
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition">
                  TANCET, MAT &amp; CAT (MBA)
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Preparation Pillars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Learning System
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <a href="#experience" className="hover:text-white transition">
                  Daily Practice (DPP)
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-white transition">
                  NTA Exam Simulation
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-white transition">
                  Bilingual Audio Lectures
                </a>
              </li>
              <li>
                <a href="#journey" className="hover:text-white transition">
                  Diagnostic Rank Telemetry
                </a>
              </li>
              <li>
                <a href="#achievements" className="hover:text-white transition">
                  Verified Selections
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Portals &amp; Access
            </h4>
            <ul className="mt-4 space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/login" className="hover:text-white transition">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  New Student
                </Link>
              </li>
              <li>
                <Link href="/administration" className="hover:text-white transition">
                  Administrator SSO
                </Link>
              </li>
              <li>
                <a href="#courses" className="hover:text-white transition">
                  Academic Calendar 2026
                </a>
              </li>
              <li>
                <a href="tel:+919894850370" className="hover:text-white transition">
                  Direct Student Grievance: +91 98948 50370
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Enterprise Bottom Legal & Status Strip */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 I-Sharp Academy. All rights reserved.</p>
            <span>·</span>
            <span className="text-slate-400">Tamil Nadu, India</span>
          </div>

          <div className="flex items-center gap-4">
            <ApiConnectionStatus />
          </div>
        </div>
      </div>
    </footer>
  );
}
