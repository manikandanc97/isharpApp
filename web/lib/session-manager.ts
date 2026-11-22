/**
 * Enterprise Session & Expiration Manager
 *
 * Handles automatic logout, cross-tab synchronization, and seamless redirect to login screen
 * when a user session expires or becomes unauthorized.
 */

let isRedirecting = false;

export type SessionExpiredOptions = {
  destination?: string;
  reason?: 'session_expired' | 'logged_out' | 'unauthorized' | string;
  returnUrl?: string;
};

const BROADCAST_CHANNEL_NAME = 'isharp_auth_broadcast';

/**
 * Proactively triggers automatic session logout and redirects to the appropriate login screen.
 * Uses atomic guard to prevent cascade redirects from simultaneous failing requests.
 */
export async function handleSessionExpired(options: SessionExpiredOptions = {}) {
  if (typeof window === 'undefined') return;

  if (isRedirecting) return;
  isRedirecting = true;

  const currentPath = window.location.pathname;

  // Determine target login route
  const isAdminArea = currentPath === '/admin' || currentPath.startsWith('/admin') || currentPath.startsWith('/administration');
  const defaultDestination = isAdminArea ? '/administration' : '/login';
  const targetPath = options.destination ?? defaultDestination;

  // Construct target URL with clean query parameters
  const targetUrl = new URL(targetPath, window.location.origin);
  targetUrl.searchParams.set('reason', options.reason ?? 'session_expired');

  const returnUrl = options.returnUrl ?? (currentPath !== '/login' && currentPath !== '/administration' ? currentPath : undefined);
  if (returnUrl && returnUrl !== '/') {
    targetUrl.searchParams.set('returnUrl', returnUrl);
  }

  // Cross-tab synchronization via BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({
        type: 'SESSION_EXPIRED',
        destination: targetPath,
        reason: options.reason ?? 'session_expired',
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

  // Invalidate server session cookies
  try {
    await fetch('/api/auth/logout', { method: 'POST', cache: 'no-store' }).catch(() => {});
  } catch {
    // Non-critical
  }

  // If already on target login page, update search params if needed without reloading
  if (currentPath === targetPath) {
    if (!window.location.search.includes('reason=session_expired')) {
      window.location.replace(targetUrl.toString());
    } else {
      isRedirecting = false;
    }
    return;
  }

  // Perform hard replace to flush all in-memory client state and timers
  window.location.replace(targetUrl.toString());
}

/**
 * Listens for cross-tab session termination events.
 */
export function listenCrossTabSession(onExpired: (data: { destination?: string; reason?: string }) => void): () => void {
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
