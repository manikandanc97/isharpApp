import { NextResponse, type NextRequest } from 'next/server';

import { resolvePostAuthDestination } from '@/lib/auth-redirect';
import {
  clearAuthRedirectCookies,
  readAuthRedirectCookiesFromRequest,
  setAuthRedirectCookies,
} from '@/lib/auth-redirect-cookies';
import type { AuthenticatedSession } from '@/lib/auth-session';
import { getNestApiClient } from '@/lib/nest-api';
import {
  getOAuthCallbackState,
  OAUTH_POPUP_RESULT_KEY,
  type OAuthCallbackState,
} from '@/lib/oauth-flow';
import { createClient } from '@/lib/supabase/server';
import { isSecureCookieContext } from '@/lib/supabase/session-config';

function loginErrorRedirect(request: NextRequest, state: OAuthCallbackState) {
  const url = new URL('/login', request.url);
  const response = NextResponse.redirect(url);
  setAuthRedirectCookies(response, {
    notice: `oauth_${state}`,
    secure: isSecureCookieContext(request),
  });
  return response;
}

function popupResultResponse(
  request: NextRequest,
  result:
    | { type: 'isharp:oauth-complete'; destination: string }
    | { type: 'isharp:oauth-error'; state: string },
) {
  const serializedResult = JSON.stringify(result).replace(/</g, '\\u003c');
  const serializedOrigin = JSON.stringify(request.nextUrl.origin);
  const serializedStorageKey = JSON.stringify(OAUTH_POPUP_RESULT_KEY);
  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Google sign-in</title></head>
  <body>
    <p id="status">Completing Google sign-in&hellip;</p>
    <script>
      const result = ${serializedResult};
      try {
        localStorage.setItem(${serializedStorageKey}, JSON.stringify(result));
        localStorage.removeItem(${serializedStorageKey});
      } catch {}
      if (window.opener) window.opener.postMessage(result, ${serializedOrigin});
      window.close();
      setTimeout(() => {
        document.getElementById('status').textContent = 'Sign-in complete. You can close this window.';
      }, 250);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'unsafe-inline'",
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

export async function GET(request: NextRequest) {
  const isPopup = request.nextUrl.searchParams.get('popup') === '1';
  const state = getOAuthCallbackState(request.nextUrl.searchParams);
  if (state) {
    return isPopup
      ? popupResultResponse(request, { type: 'isharp:oauth-error', state })
      : loginErrorRedirect(request, state);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      request.nextUrl.searchParams.get('code')!,
    );
    if (error || !data.session?.access_token) {
      return isPopup
        ? popupResultResponse(request, {
            type: 'isharp:oauth-error',
            state: 'exchange_failed',
          })
        : loginErrorRedirect(request, 'exchange_failed');
    }

    const session = await getNestApiClient().request<AuthenticatedSession>(
      '/api/auth/me',
      { accessToken: data.session.access_token, cache: 'no-store' },
    );

    const { returnUrl } = readAuthRedirectCookiesFromRequest(request);
    const destination = resolvePostAuthDestination(session, returnUrl);
    const secure = isSecureCookieContext(request);

    const response = isPopup
      ? popupResultResponse(request, {
          type: 'isharp:oauth-complete',
          destination,
        })
      : NextResponse.redirect(new URL(destination, request.url));

    clearAuthRedirectCookies(response, secure);
    return response;
  } catch {
    return isPopup
      ? popupResultResponse(request, {
          type: 'isharp:oauth-error',
          state: 'exchange_failed',
        })
      : loginErrorRedirect(request, 'exchange_failed');
  }
}
