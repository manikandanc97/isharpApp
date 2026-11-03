'use client';

import { AlertCircle, CheckCircle2, LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuthenticatedSession, RoleName } from '@/lib/auth-session';
import { hasRequiredRole } from '@/lib/role-policy';

type Area = 'student' | 'admin' | 'superadmin';

const areaConfig: Record<Area, { title: string; requiredRole: RoleName }> = {
  student: { title: 'Student Dashboard', requiredRole: 'STUDENT' },
  admin: { title: 'Admin Dashboard', requiredRole: 'ADMIN' },
  superadmin: { title: 'Super Admin Dashboard', requiredRole: 'SUPERADMIN' },
};

export function RoleDashboard({ area }: { area: Area }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthenticatedSession | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'unauthenticated' | 'forbidden' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const config = areaConfig[area];

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const sessionResponse = await fetch('/api/session', { cache: 'no-store' });
        if (sessionResponse.status === 401) {
          if (active) setStatus('unauthenticated');
          return;
        }
        if (!sessionResponse.ok) throw new Error('Authentication API connection failed');
        const currentSession = (await sessionResponse.json()) as AuthenticatedSession;
        if (active) setSession(currentSession);

        if (!hasRequiredRole(currentSession.roles, config.requiredRole)) {
          if (active) setStatus('forbidden');
          return;
        }

        const accessResponse = await fetch(`/api/access/${area}`, { cache: 'no-store' });
        const payload = (await accessResponse.json()) as { message?: string };
        if (accessResponse.status === 401) {
          if (active) setStatus('unauthenticated');
          return;
        }
        if (accessResponse.status === 403) {
          if (active) setStatus('forbidden');
          return;
        }
        if (!accessResponse.ok) throw new Error(payload.message ?? 'API connection failed');
        if (active) {
          setMessage(payload.message ?? 'API access confirmed');
          setStatus('ready');
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'API connection failed');
          setStatus('error');
        }
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [area, config.requiredRole]);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="min-h-svh bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <BrandLogo priority className="h-9 w-auto" />
          {session && (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1 size-3.5" /> Sign out
            </Button>
          )}
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-brand-red text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-red">RBAC integration test</p>
              <h1 className="text-2xl font-black">{config.title}</h1>
            </div>
          </div>

          {status === 'loading' && (
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-4 rounded-full" />
                  <Skeleton className="h-4 w-48 rounded-md" />
                </div>
                <Skeleton className="h-3.5 w-64 rounded-md" />
                <Skeleton className="h-3 w-40 rounded-md" />
              </div>
              <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
                {[1, 2, 3].map((card) => (
                  <div key={card} className="rounded-2xl border border-slate-100 p-4 space-y-2">
                    <Skeleton className="h-3 w-20 rounded-md" />
                    <Skeleton className="h-6 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {status === 'ready' && (
            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="flex items-center gap-2 font-bold"><CheckCircle2 className="size-4" /> Authorized</p>
              <p className="mt-1 text-sm">{message}</p>
              <p className="mt-2 text-xs">Server roles: {session?.roles.join(', ')}</p>
            </div>
          )}
          {status === 'unauthenticated' && (
            <StateMessage title="Authentication required" message="Sign in before opening this protected dashboard." href="/login" />
          )}
          {status === 'forbidden' && (
            <StateMessage title="403 — Access forbidden" message={`This session does not have the required ${config.requiredRole} permission.`} href="/login" />
          )}
          {status === 'error' && (
            <StateMessage title="API connection error" message={message} href="/login" />
          )}

          <nav className="mt-8 flex flex-wrap gap-2 border-t border-slate-100 pt-5 text-xs font-semibold">
            <Link className="rounded-full border px-3 py-1.5 hover:bg-slate-50" href="/dashboard/student">Student</Link>
            <Link className="rounded-full border px-3 py-1.5 hover:bg-slate-50" href="/admin">Admin</Link>
            <Link className="rounded-full border px-3 py-1.5 hover:bg-slate-50" href="/dashboard/superadmin">Super Admin</Link>
          </nav>
        </section>
      </div>
    </main>
  );
}

function StateMessage({ title, message, href }: { title: string; message: string; href: string }) {
  return (
    <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
      <p className="flex items-center gap-2 font-bold"><AlertCircle className="size-4" /> {title}</p>
      <p className="mt-1 text-sm">{message}</p>
      <Link className="mt-3 inline-block text-xs font-bold underline" href={href}>Return to login</Link>
    </div>
  );
}
