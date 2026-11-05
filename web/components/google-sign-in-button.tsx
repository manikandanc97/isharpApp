'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import {
  buildOAuthPopupCallbackUrl,
  OAUTH_POPUP_RESULT_KEY,
  oauthStatusMessages,
} from '@/lib/oauth-flow';
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const closeWatcherRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopWatchingPopup() {
    if (closeWatcherRef.current) {
      clearInterval(closeWatcherRef.current);
      closeWatcherRef.current = null;
    }
  }

  useEffect(() => {
    function finish(result: OAuthPopupResult) {
      stopWatchingPopup();
      popupRef.current = null;
      setLoading(false);

      if (result.type === 'isharp:oauth-complete') {
        router.replace(result.destination);
        router.refresh();
        return;
      }

      onError?.(
        oauthStatusMessages[result.state] ??
          'Google sign-in could not be completed. Please try again.',
      );
    }

    function onMessage(event: MessageEvent<OAuthPopupResult>) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== popupRef.current) return;
      if (!isOAuthPopupResult(event.data)) return;
      finish(event.data);
    }

    function onStorage(event: StorageEvent) {
      if (event.key !== OAUTH_POPUP_RESULT_KEY || !event.newValue) return;
      try {
        const result: unknown = JSON.parse(event.newValue);
        if (isOAuthPopupResult(result)) finish(result);
      } catch {
        // Ignore malformed cross-tab messages.
      }
    }

    window.addEventListener('message', onMessage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('storage', onStorage);
      stopWatchingPopup();
    };
  }, [onError, router]);

  async function signIn() {
    const width = 520;
    const height = 680;
    const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
    const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
      'about:blank',
      'isharp-google-sign-in',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`,
    );

    if (!popup) {
      onError?.('Please allow popups for this site, then try Google sign-in again.');
      return;
    }

    popupRef.current = popup;
    setLoading(true);
    onError?.('');
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: buildOAuthPopupCallbackUrl(window.location.origin),
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error('Google sign-in URL was not returned.');

      popup.location.replace(data.url);
      closeWatcherRef.current = setInterval(() => {
        if (!popup.closed) return;
        stopWatchingPopup();
        popupRef.current = null;
        setLoading(false);
      }, 500);
    } catch (error) {
      popup.close();
      popupRef.current = null;
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

type OAuthPopupResult =
  | { type: 'isharp:oauth-complete'; destination: string }
  | { type: 'isharp:oauth-error'; state: string };

function isOAuthPopupResult(value: unknown): value is OAuthPopupResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  return (
    (result.type === 'isharp:oauth-complete' &&
      typeof result.destination === 'string' &&
      result.destination.startsWith('/')) ||
    (result.type === 'isharp:oauth-error' && typeof result.state === 'string')
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
