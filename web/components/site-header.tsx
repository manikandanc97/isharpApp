import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { PageContainer } from "@/components/layout/layout-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-xs transition-all">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-brand-red"
        aria-hidden="true"
      />

      <PageContainer className="flex h-(--layout-site-header-height) items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="flex items-center transition-opacity hover:opacity-95">
            <BrandLogo priority className="h-8.5 w-auto sm:h-9.5" />
          </div>

          <span
            className="hidden h-5 w-px bg-slate-300 sm:block"
            aria-hidden="true"
          />

          <Badge
            variant="outline"
            className="hidden items-center gap-2 rounded-full border-slate-200/90 bg-slate-50 px-3.5 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:border-blue-200 hover:bg-blue-50/60 lg:flex"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-40" />
              <span className="relative inline-flex size-2 rounded-full bg-brand-blue" />
            </span>
            <span className="font-semibold tracking-tight text-slate-900">
              தமிழ்
            </span>
            <span className="font-light text-slate-400">+</span>
            <span className="font-semibold tracking-tight text-slate-900">
              English
            </span>
            <span className="h-2.5 w-px bg-slate-200" aria-hidden="true" />
            <span className="font-normal tracking-tight text-slate-500">
              Dual-Instruction
            </span>
          </Badge>
        </div>

        <Button
          size="sm"
          nativeButton={false}
          className="rounded-full bg-brand-red px-4.5 text-xs font-semibold text-white shadow-primary transition-all duration-200 hover:bg-brand-red-hover active:scale-95"
          render={
            <Link href="/login" className="inline-flex items-center gap-1.5">
              <span>Sign In</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          }
        />
      </PageContainer>
    </header>
  );
}
