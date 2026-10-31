"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ArrowRight, ChevronDown, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigationLinks = [
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
            <BrandLogo priority className="h-8.5 sm:h-9.5 w-auto" />
          </div>

          <span
            className="hidden h-5 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent sm:block"
            aria-hidden="true"
          />

          {/* Bilingual Capsule Indicator using Shadcn Badge */}
          <Badge
            variant="outline"
            className="hidden lg:flex items-center gap-2 rounded-full border-slate-200/90 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/40 px-3.5 py-1 text-2xs font-medium text-slate-700 shadow-2xs hover:border-blue-200"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2525b8] opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-[#2525b8]" />
            </span>
            <span className="font-bold text-slate-900 tracking-tight">தமிழ்</span>
            <span className="text-slate-400 font-light">+</span>
            <span className="font-bold text-slate-900 tracking-tight">English</span>
            <span className="h-2.5 w-px bg-slate-200" aria-hidden="true" />
            <span className="text-slate-500 font-normal tracking-tight">Dual-Instruction</span>
          </Badge>
        </div>

        {/* Center Desktop Navigation with Shadcn DropdownMenu */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200/60 bg-slate-50/70 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          aria-label="Main Navigation"
        >
          {/* Shadcn DropdownMenu for Curriculum */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-white hover:text-slate-900 hover:shadow-2xs cursor-pointer outline-none select-none"
                >
                  <span>Curriculum</span>
                  <ChevronDown className="size-3 text-slate-400" />
                </button>
              }
            />
            <DropdownMenuContent
              align="start"
              className="w-64 rounded-2xl border-slate-200 bg-white p-1.5 shadow-xl"
            >
              <DropdownMenuLabel className="px-2.5 py-1.5 text-3xs font-bold uppercase tracking-wider text-slate-400">
                Academic Programs 2026
              </DropdownMenuLabel>
              <DropdownMenuItem
                render={
                  <Link
                    href="#courses"
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-[#2525b8]"
                  >
                    <span className="size-2 rounded-full bg-[#e51d35] shrink-0" />
                    <span>NEET 2026 Full Course</span>
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link
                    href="#courses"
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-[#2525b8]"
                  >
                    <span className="size-2 rounded-full bg-[#2525b8] shrink-0" />
                    <span>10 மாதிரி தேர்வு (Tamil Medium)</span>
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link
                    href="#courses"
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-[#2525b8]"
                  >
                    <span className="size-2 rounded-full bg-[#2525b8] shrink-0" />
                    <span>JEE Main &amp; Advanced 2026</span>
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link
                    href="#courses"
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 transition hover:bg-blue-50 hover:text-[#2525b8]"
                  >
                    <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span>10 Grand Mocks Series</span>
                  </Link>
                }
              />
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                render={
                  <Link
                    href="#courses"
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2525b8] transition hover:bg-blue-50"
                  >
                    <span>Explore All Programs</span>
                    <ArrowRight className="size-3" />
                  </Link>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>

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

        {/* Right Action: Luxury Sign In Button & Mobile Toggle using Shadcn Button */}
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            nativeButton={false}
            className="rounded-full bg-[#2525b8] hover:bg-[#1a187a] px-4.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            render={
              <Link href="/login" className="inline-flex items-center gap-1.5">
                <span>Sign In</span>
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            }
          />

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
            <Link
              href="#courses"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>Curriculum &amp; Programs</span>
              <ArrowRight className="size-3.5 text-slate-400" />
            </Link>
            {navigationLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <span>{link.label}</span>
                <ArrowRight className="size-3.5 text-slate-400" />
              </Link>
            ))}

            <div className="mt-3 flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50 px-3.5 py-2 text-2xs font-medium text-slate-700">
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