'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { isProtectedRoute } from '@/lib/auth-redirect';
import {
  handleSessionExpired,
  listenCrossTabSession,
  type SessionExpiredOptions,
} from '@/lib/session-manager';
import { createClient } from '@/lib/supabase/client';

export function SessionExpiryProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Cross-tab session sync: when another tab logs out or expires
    const unsubscribeCrossTab = listenCrossTabSession(() => {
      if (isProtectedRoute(window.location.pathname)) {
        handleSessionExpired();
      }
    });

    // 2. Supabase auth state change listener
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
          if (isProtectedRoute(window.location.pathname)) {
            handleSessionExpired();
          }
        }
      },
    );

    // 3. Tab visibility / Idle wake-up check
    let sessionVerificationPromise: Promise<boolean> | null = null;

    const verifyOrRefreshSession = async (): Promise<boolean> => {
      if (sessionVerificationPromise) return sessionVerificationPromise;
      sessionVerificationPromise = (async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            // Do not destroy session on transient network/wake-up errors
            const status = (error as { status?: number }).status;
            if (
              error.name === 'AuthRetryableFetchError' ||
              status === 0 ||
              status === 429 ||
              (typeof status === 'number' && status >= 500)
            ) {
              return true;
            }
            return false;
          }
          if (!data.session) return false;

          const expiresAt = data.session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          if (typeof expiresAt === 'number' && expiresAt <= now + 30) {
            const { data: refreshed, error: refreshError } =
              await supabase.auth.refreshSession();
            if (refreshError) {
              const status = (refreshError as { status?: number }).status;
              if (
                refreshError.name === 'AuthRetryableFetchError' ||
                status === 0 ||
                status === 429 ||
                (typeof status === 'number' && status >= 500)
              ) {
                return true;
              }
              return false;
            }
            return Boolean(refreshed.session);
          }
          return true;
        } catch {
          return true;
        } finally {
          sessionVerificationPromise = null;
        }
      })();
      return sessionVerificationPromise;
    };

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isProtectedRoute(window.location.pathname)) {
        const valid = await verifyOrRefreshSession();
        if (!valid) {
          handleSessionExpired();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Prevent bfcache back-navigation from showing stale protected pages after logout
    const handlePageShow = async (event: PageTransitionEvent) => {
      if (event.persisted && isProtectedRoute(window.location.pathname)) {
        const valid = await verifyOrRefreshSession();
        if (!valid) {
          handleSessionExpired();
        }
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    // 4. Custom event trigger
    const handleCustomEvent = (event: Event) => {
      const customEvent = event as CustomEvent<SessionExpiredOptions>;
      handleSessionExpired(customEvent.detail);
    };
    window.addEventListener('isharp:session-expired', handleCustomEvent);

    // 5. Global fetch interceptor for 401 responses on internal APIs
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      if (response.status === 401) {
        const input = args[0];
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
            ? input.toString()
            : input instanceof Request
            ? input.url
            : '';

        // Exclude authentication credentials submission & logout endpoints
        const isAuthSubmit =
          url.includes('/api/auth/admin-login') ||
          url.includes('/api/auth/logout') ||
          url.includes('/api/auth/callback');

        if (!isAuthSubmit && url.includes('/api/') && isProtectedRoute(window.location.pathname)) {
          if (url.includes('/api/session')) {
            handleSessionExpired();
          } else {
            const valid = await verifyOrRefreshSession();
            if (!valid) {
              handleSessionExpired();
            }
          }
        }
      }
      return response;
    };

    return () => {
      unsubscribeCrossTab();
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('isharp:session-expired', handleCustomEvent);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
