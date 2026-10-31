import type { Metadata } from "next";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Login | I-Sharp Academy",
  description: "Sign in to the I-Sharp Academy learning portal.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b bg-card/95">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center px-5 sm:h-24 sm:px-8 lg:px-10">
          <BrandLogo priority />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 overflow-x-clip px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-20 xl:grid-cols-3 xl:gap-24">
        <section
          aria-labelledby="brand-heading"
          className="relative isolate flex min-w-0 flex-col justify-center lg:min-h-140 xl:col-span-2"
        >
          <div
            aria-hidden="true"
            className="absolute top-1/2 -left-44 -z-10 hidden size-120 -translate-y-1/2 rounded-full border border-secondary/8 lg:block"
          />
          <div
            aria-hidden="true"
            className="absolute top-1/2 -left-28 -z-10 hidden size-84 -translate-y-1/2 rounded-full border border-primary/8 lg:block"
          />

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-3 text-xs font-semibold tracking-eyebrow text-secondary uppercase">
              <span className="h-px w-9 bg-primary" aria-hidden="true" />
              Built for ambitious minds
            </div>
            <h1
              id="brand-heading"
              className="mt-5 max-w-xl text-3xl leading-tight font-semibold tracking-heading text-foreground sm:text-4xl lg:text-5xl"
            >
              Your journey to excellence starts here.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Focused preparation, expert guidance, and steady progress for
              every NEET and JEE aspirant ready to aim higher.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative mt-10 hidden h-52 max-w-xl sm:block lg:mt-14 lg:h-56"
          >
            <div className="absolute top-5 right-6 left-10 h-px bg-slate-200" />
            <div className="absolute top-5 left-1/5 h-32 w-px bg-slate-200" />
            <div className="absolute top-5 left-3/5 h-40 w-px bg-slate-200" />

            <div className="absolute top-0 left-1/6 size-3 rounded-full border-3 border-background bg-secondary ring-1 ring-secondary/20" />
            <div className="absolute top-0 left-3/5 size-3 rounded-full border-3 border-background bg-primary ring-1 ring-primary/20" />

            <div className="absolute bottom-7 left-0 w-1/2 -rotate-2 rounded-2xl border border-secondary/10 bg-white/75 p-5 shadow-card backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-semibold tracking-label text-secondary uppercase">
                  Foundation
                </span>
                <span className="size-2 rounded-full bg-secondary" />
              </div>
              <div className="mt-5 space-y-2.5">
                <div className="h-1.5 w-full rounded-full bg-secondary/8">
                  <div className="h-full w-4/5 rounded-full bg-secondary/60" />
                </div>
                <div className="h-1.5 w-3/4 rounded-full bg-foreground/8" />
              </div>
            </div>

            <div className="absolute right-2 bottom-0 w-1/2 rotate-2 rounded-2xl border border-primary/10 bg-white/90 p-5 shadow-card-hover backdrop-blur-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="text-2xs font-semibold tracking-label text-primary uppercase">
                    Weekly progress
                  </span>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                    Keep moving forward
                  </p>
                </div>
                <div className="flex h-14 items-end gap-1.5">
                  <span className="h-5 w-2 rounded-full bg-secondary/20" />
                  <span className="h-8 w-2 rounded-full bg-secondary/45" />
                  <span className="h-11 w-2 rounded-full bg-primary/70" />
                  <span className="h-14 w-2 rounded-full bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="flex w-full min-w-0 justify-center lg:justify-end">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
