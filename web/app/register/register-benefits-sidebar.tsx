export const onboardingSteps = [
  {
    title: "Create your secure login",
    description:
      "Any student can register using an email address or a Google account.",
  },
  {
    title: "Eligibility is checked automatically",
    description:
      "An email in the I-Sharp student roster is identified as an internal student.",
  },
  {
    title: "Start with the right access plan",
    description:
      "I-Sharp students receive free access; all other students need a paid plan.",
  },
] as const;

export function RegisterBenefitsSidebar() {
  return (
    <section className="lg:col-span-6 xl:col-span-7">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-red uppercase">
        Student Registration
      </span>
      <h1 className="mt-3 type-hero text-slate-900">
        One account for practice, tests, and mentorship.
      </h1>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Register now to access Daily Practice Problems, simulated mock tests,
        and comprehensive bilingual review material.
      </p>

      <div className="mt-6 space-y-3">
        {onboardingSteps.map((step, index) => (
          <div
            key={step.title}
            className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3.5 shadow-2xs sm:p-4"
          >
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-blue text-xs font-semibold text-white shadow-2xs">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {step.title}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 max-w-xl rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs leading-5 text-amber-950">
        <strong>Are you an I-Sharp student?</strong> Use the same email
        recorded by the academy to receive free access automatically.
        Other email addresses are registered as paid-plan accounts.
      </div>
    </section>
  );
}

