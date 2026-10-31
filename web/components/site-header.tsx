"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight, Menu, X } from "lucide-react";

const navigationLinks = [
  { label: "Curriculum", href: "#courses" },
  { label: "Methodology", href: "#journey" },
  { label: "Experience", href: "#experience" },
  { label: "Results", href: "#achievements" },
];

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 shadow-[0_4px_25px_-5px_rgba(15,23,42,0.03)] transition-all">
      {/* Top subtle luxury hairline accent */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#2525b8]/35 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        {/* Brand Logo & Luxury Language Capsule */}
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex items-center transition-opacity hover:opacity-95">
            <BrandLogo priority />
          </div>

          <span
            className="hidden h-5 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent sm:block"
            aria-hidden="true"
          />

          {/* Bilingual Capsule Indicator */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200/80 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/40 px-3.5 py-1 text-2xs font-medium text-slate-700 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-xs transition-all hover:border-blue-200/90 hover:shadow-2xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2525b8] opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-[#2525b8]" />
            </span>
            <span className="font-bold text-slate-900 tracking-tight">தமிழ்</span>
            <span className="text-slate-400 font-light">+</span>
            <span className="font-bold text-slate-900 tracking-tight">English</span>
            <span className="h-2.5 w-px bg-slate-200" aria-hidden="true" />
            <span className="text-slate-500 font-normal tracking-tight">Dual-Instruction</span>
          </div>
        </div>

        {/* Center Desktop Navigation: Simple, Clean & Refined */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/50 bg-slate-50/60 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          aria-label="Main Navigation"
        >
          {navigationLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-900 hover:shadow-2xs"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Action: Luxury Sign In Button & Mobile Toggle */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#191747] via-[#24215d] to-[#2525b8] px-4.5 py-2 text-xs font-semibold text-white shadow-[0_2px_10px_rgba(36,33,93,0.22)] transition-all duration-300 hover:shadow-[0_4px_18px_rgba(37,37,184,0.35)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Sign In</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
            {/* Subtle Shimmer Sheen on Hover */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="grid size-9 place-items-center rounded-full border border-slate-200/80 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200/70 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden animate-in slide-in-from-top-2 duration-200 shadow-lg">
          <div className="flex flex-col gap-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span>{link.label}</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
            ))}

            <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 p-2.5 text-2xs font-medium text-slate-700">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2525b8] opacity-50" />
                <span className="relative inline-flex size-2 rounded-full bg-[#2525b8]" />
              </span>
              <span className="font-bold text-slate-900">தமிழ் + English</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">Dual-Instruction Portal</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}