'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  handleSessionExpired,
  listenCrossTabSession,
  type SessionExpiredOptions,
} from '@/lib/session-manager';
import { createClient } from '@/lib/supabase/client';

function isProtectedRoute(path: string): boolean {
  return (
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/exam') ||
    path === '/role-dashboard'
  );
}

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
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isProtectedRoute(window.location.pathname)) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            handleSessionExpired();
            return;
          }
          // Check expiration
          const expiresAt = data.session.expires_at;
          if (typeof expiresAt === 'number') {
            const now = Math.floor(Date.now() / 1000);
            if (expiresAt <= now) {
              handleSessionExpired();
            }
          }
        } catch {
          // If network error on wake-up, let normal flow handle it
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

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

        if (!isAuthSubmit && url.includes('/api/')) {
          handleSessionExpired();
        }
      }
      return response;
    };

    return () => {
      unsubscribeCrossTab();
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('isharp:session-expired', handleCustomEvent);
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
