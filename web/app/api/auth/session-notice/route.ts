import { NextResponse, type NextRequest } from 'next/server';

import { clearAuthNoticeCookie } from '@/lib/auth-redirect-cookies';
import { isSecureCookieContext } from '@/lib/supabase/session-config';

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json(
    { cleared: true },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
  clearAuthNoticeCookie(response, isSecureCookieContext(request));
  return response;
}
