import { Clock3, LogOut, ShieldCheck } from 'lucide-react';

import { BrandLogo } from '@/components/brand-logo';
import { SignOutButton } from '@/components/sign-out-button';

export default function PendingAccessPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-card sm:p-9">
        <BrandLogo priority className="mx-auto h-10 w-auto" />
        <div className="mx-auto mt-7 grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200">
          <Clock3 className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-tight">Account setup incomplete</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your login did not include a usable email address, so student access could not be classified automatically.
        </p>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-indigo-50 p-4 text-left text-xs leading-5 text-indigo-950">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" />
          <p>Sign in with the same email recorded by I-Sharp Academy. Internal roster matches receive free access; all other student accounts use an external paid plan.</p>
        </div>
        <SignOutButton className="mt-6 mx-auto">
          <LogOut className="mr-2 size-4" /> Sign out
        </SignOutButton>
      </section>
    </main>
  );
}
