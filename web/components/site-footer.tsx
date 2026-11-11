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
import { PageContainer, Stack } from "@/components/layout/layout-primitives";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/90 bg-[#f4f6fb] text-slate-700">
      {/* Editorial Quote Bar - Authoritative Brand Blue Banner */}
      <div className="border-b border-blue-900/30 bg-gradient-to-r from-[#141b4e] via-brand-blue to-[#141b4e] text-white shadow-xs">
        <PageContainer className="flex flex-col items-center justify-between gap-4 py-3.5 text-center md:flex-row md:text-left">
          <div className="flex items-center gap-3">
            <span className="grid size-8.5 place-items-center rounded-xl bg-white/10 text-rose-300 border border-white/20 shadow-2xs">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                &ldquo;Consistency beats intensity. When practice becomes reflex, rank becomes inevitable.&rdquo;
              </p>
              <p className="text-xs font-medium text-rose-200">
                — I-Sharp Academic Directorate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white shadow-2xs">
            <ShieldCheck className="size-3.5 text-rose-300" />
            <span>NTA Calibrated Curriculum Standard</span>
          </div>
        </PageContainer>
      </div>

      {/* Main Footer Content */}
      <PageContainer className="py-(--space-layout)">
        <Stack gap="section">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info */}
          <Stack gap="lg" className="lg:col-span-2">
            <Stack gap="sm">
              <div className="w-fit">
                <BrandLogo />
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-slate-600 sm:text-sm">
                Premier NEET, IIT-JEE &amp; MBA Entrance coaching centre in Coimbatore.
                Empowering students with disciplined pedagogy, separate Tamil Medium foundation batches,
                calibrated test series, and personalized one-on-one doubt clearance.
              </p>
            </Stack>
            <Stack gap="sm" className="text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <Phone className="size-4 text-brand-red shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span>
                    Helpline:{" "}
                    <a href="tel:+919894850370" className="hover:text-brand-red font-semibold text-slate-800 transition">
                      +91 98948 50370
                    </a>{" "}
                    /{" "}
                    <a href="tel:+918148217151" className="hover:text-brand-red font-semibold text-slate-800 transition">
                      +91 81482 17151
                    </a>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="size-4 text-brand-blue shrink-0" />
                <a href="mailto:isharpacademy@gmail.com" className="hover:text-brand-blue font-semibold text-slate-800 transition">
                  isharpacademy@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-brand-red shrink-0 mt-0.5" />
                <span className="leading-snug text-slate-600">
                  2nd Floor, AK Complex, No.207, 6th Street, Cross Cut Rd, Gandhipuram, Coimbatore – 641012, Tamil Nadu
                </span>
              </div>
            </Stack>

            {/* Security Badges */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/90 pt-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-2xs">
                <Lock className="size-3 text-brand-blue" /> 256-Bit TLS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-brand-blue shadow-2xs">
                <CheckCircle2 className="size-3 text-brand-blue" /> ISO 9001:2015
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-brand-red shadow-2xs">
                <ShieldCheck className="size-3 text-brand-red" /> NTA Aligned
              </span>
            </div>
          </Stack>

          {/* Column 1: Academic Programs */}
          <Stack gap="sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Academic Curriculums
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  NEET Classroom &amp; Distance Prep
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  NEET Tamil Medium Foundation
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  IIT-JEE Main &amp; Advanced
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  NEET All-India Test Series (AITS)
                </a>
              </li>
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  TANCET, MAT &amp; CAT (MBA)
                </a>
              </li>
            </ul>
          </Stack>

          {/* Column 2: Preparation Pillars */}
          <Stack gap="sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Learning System
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <a href="#experience" className="hover:text-brand-blue font-medium transition">
                  Daily Practice (DPP)
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-brand-blue font-medium transition">
                  NTA Exam Simulation
                </a>
              </li>
              <li>
                <a href="#experience" className="hover:text-brand-blue font-medium transition">
                  Bilingual Audio Lectures
                </a>
              </li>
              <li>
                <a href="#journey" className="hover:text-brand-blue font-medium transition">
                  Diagnostic Rank Telemetry
                </a>
              </li>
              <li>
                <a href="#achievements" className="hover:text-brand-blue font-medium transition">
                  Verified Selections
                </a>
              </li>
            </ul>
          </Stack>

          {/* Column 3: Portals & Compliance */}
          <Stack gap="sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Portals &amp; Access
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              <li>
                <Link href="/login" className="hover:text-brand-red font-medium transition">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-brand-red font-medium transition">
                  Create Student Account
                </Link>
              </li>
              <li>
                <Link href="/administration" className="hover:text-brand-red font-medium transition">
                  Administrator SSO
                </Link>
              </li>
              <li>
                <a href="#courses" className="hover:text-brand-red font-medium transition">
                  Academic Calendar 2026
                </a>
              </li>
              <li>
                <a href="tel:+919894850370" className="hover:text-brand-red font-medium transition">
                  Direct Student Grievance: +91 98948 50370
                </a>
              </li>
            </ul>
          </Stack>
        </div>

        {/* Bottom Legal & Status Strip */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/90 pt-6 text-xs text-slate-500 sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <p>© 2026 I-Sharp Academy. All rights reserved.</p>
            <span>·</span>
            <span className="text-slate-600 font-medium">Tamil Nadu, India</span>
          </div>

          <div className="flex items-center gap-4">
            <ApiConnectionStatus />
          </div>
        </div>
        </Stack>
      </PageContainer>
    </footer>
  );
}
