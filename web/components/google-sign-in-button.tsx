'use client';

import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

import { buildOAuthCallbackUrl } from '@/lib/oauth-flow';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function GoogleSignInButton({
  className,
  label = 'Continue with Google',
  onError,
}: {
  className?: string;
  label?: string;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    onError?.('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildOAuthCallbackUrl(window.location.origin),
        },
      });
      if (error) throw error;
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : 'Google sign-in could not be started.',
      );
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={signIn}
      className={cn(
        'flex h-10.5 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue disabled:cursor-wait disabled:opacity-60 sm:text-sm',
        className,
      )}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <GoogleMark />
      )}
      <span>{loading ? 'Opening Google…' : label}</span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.6 0-4.81-1.76-5.6-4.13H3.05v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.92a6.02 6.02 0 0 1 0-3.84V7.46H3.05a10 10 0 0 0 0 9.08l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.78.5 3.81 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.95 5.46l3.35 2.62c.79-2.37 3-4.13 5.6-4.13Z" />
    </svg>
  );
}
