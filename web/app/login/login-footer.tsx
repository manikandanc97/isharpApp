import { ArrowRight, Headphones, UserPlus } from "lucide-react";
import Link from "next/link";
import { DemoTestCard } from "@/components/demo-test";

export function LoginFooter() {
  return (
    <>
      {/* Demo Test Direct Quick Trigger */}
      <div className="mt-3">
        <DemoTestCard compact />
      </div>

      {/* Divider */}
      <div className="relative my-2.5 sm:my-3 text-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200" />
        </div>
        <span className="relative bg-white px-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          First time here?
        </span>
      </div>

      {/* Register Promotion Box */}
      <Link
        href="/register"
        className="group flex items-center justify-between rounded-xl border border-blue-200/80 bg-blue-50/50 px-3 py-2 transition hover:bg-blue-50 hover:border-blue-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="grid size-7.5 shrink-0 place-items-center rounded-lg bg-brand-blue text-white shadow-2xs">
            <UserPlus className="size-3.5" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition">
              Create your student account
            </p>
            <p className="text-xs text-slate-500">
              I-Sharp students free; other students paid
            </p>
          </div>
        </div>
        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-blue" />
      </Link>

      {/* Help & Support Footer */}
      <div className="mt-2.5 flex items-center justify-center gap-1 text-xs text-slate-400">
        <Headphones className="size-2.5 text-slate-400" />
        <span>Helpline:</span>
        <a
          href="tel:+919894850370"
          className="font-semibold text-slate-600 hover:text-slate-900 hover:underline"
        >
          +91 98948 50370
        </a>
      </div>
    </>
  );
}

