/**
 * Enterprise Session & Expiration Manager
 *
 * Handles automatic logout, cross-tab synchronization, and seamless redirect to
 * clean canonical login screens when a user session expires or becomes unauthorized.
 */

import { getLoginPathForRoute, sanitizeReturnUrl } from './auth-redirect';

let isRedirecting = false;

export type SessionExpiredOptions = {
  destination?: string;
  reason?: 'session_expired' | 'logged_out' | 'unauthorized' | string;
  returnUrl?: string;
};

const BROADCAST_CHANNEL_NAME = 'isharp_auth_broadcast';

/**
 * Proactively triggers automatic session logout and redirects to the canonical login screen
 * without exposing session reason or returnUrl in browser-visible URLs.
 */
export async function handleSessionExpired(options: SessionExpiredOptions = {}) {
  if (typeof window === 'undefined') return;

  if (isRedirecting) return;
  isRedirecting = true;

  const currentPath = window.location.pathname;
  const currentFullPath = `${currentPath}${window.location.search ?? ''}`;

  const targetPath = options.destination ?? getLoginPathForRoute(currentPath);
  const targetUrl = new URL(targetPath, window.location.origin);

  const reason = options.reason ?? 'session_expired';
  const rawReturnUrl =
    reason === 'logged_out'
      ? null
      : (options.returnUrl ?? sanitizeReturnUrl(currentFullPath));
  const safeReturnUrl = sanitizeReturnUrl(rawReturnUrl);

  // Cross-tab synchronization via BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'SESSION_EXPIRED',
        destination: targetPath,
        reason,
        timestamp: Date.now(),
      });
      channel.close();
    }
  } catch {
    // Non-critical fallback
  }

  // Clear local storage markers
  try {
    window.localStorage.removeItem('supabase.auth.token');
    window.sessionStorage.clear();
  } catch {
    // Non-critical
  }

  // Invalidate Supabase client session
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  } catch {
    // Non-critical
  }

  // Invalidate server session cookies & persist short-lived HttpOnly redirect state
  try {
    if (typeof fetch === 'function') {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          returnUrl: safeReturnUrl ?? undefined,
        }),
        cache: 'no-store',
      }).catch(() => {});
    }
  } catch {
    // Non-critical
  }

  // If already on target login page, avoid redundant reload
  if (currentPath === targetPath) {
    isRedirecting = false;
    return;
  }

  // Perform hard replace to flush all in-memory client state and timers
  window.location.replace(targetUrl.toString());
}

/**
 * Listens for cross-tab session termination events.
 */
export function listenCrossTabSession(
  onExpired: (data: { destination?: string; reason?: string }) => void,
): () => void {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return () => {};
  }

  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SESSION_EXPIRED') {
        onExpired(event.data);
      }
    };
    channel.addEventListener('message', handler);
    return () => {
      channel.removeEventListener('message', handler);
      channel.close();
    };
  } catch {
    return () => {};
  }
}
