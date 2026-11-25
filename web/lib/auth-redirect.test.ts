import { describe, expect, it } from 'vitest';

import type { AuthenticatedSession } from './auth-session';
import {
  getAuthNoticeMessage,
  getLoginPathForRoute,
  isAdminRoute,
  isProtectedRoute,
  resolvePostAuthDestination,
  sanitizeReturnUrl,
} from './auth-redirect';

const adminSession: AuthenticatedSession = {
  authUserId: 'admin-1',
  profileId: 'prof-admin',
  roles: ['ADMIN'],
};

const superadminSession: AuthenticatedSession = {
  authUserId: 'super-1',
  profileId: 'prof-super',
  roles: ['SUPERADMIN'],
};

const studentSession: AuthenticatedSession = {
  authUserId: 'stu-1',
  profileId: 'prof-stu',
  roles: ['STUDENT'],
  studentAccess: {
    category: 'INTERNAL',
    paymentStatus: 'NOT_REQUIRED',
    paidAccessUntil: null,
    hasLearningAccess: true,
  },
};

const unpaidExternalStudentSession: AuthenticatedSession = {
  authUserId: 'stu-2',
  profileId: 'prof-stu-2',
  roles: ['STUDENT'],
  studentAccess: {
    category: 'EXTERNAL',
    paymentStatus: 'PENDING',
    paidAccessUntil: null,
    hasLearningAccess: false,
  },
};

describe('auth-redirect policy', () => {
  it('identifies protected and admin routes accurately', () => {
    expect(isProtectedRoute('/admin')).toBe(true);
    expect(isProtectedRoute('/admin/question-bank')).toBe(true);
    expect(isProtectedRoute('/dashboard/student')).toBe(true);
    expect(isProtectedRoute('/dashboard/superadmin')).toBe(true);
    expect(isProtectedRoute('/exam/attempt-123')).toBe(true);
    expect(isProtectedRoute('/plans')).toBe(true);
    expect(isProtectedRoute('/login')).toBe(false);
    expect(isProtectedRoute('/administration')).toBe(false);
    expect(isProtectedRoute('/')).toBe(false);
    expect(isProtectedRoute('/demo-test')).toBe(false);

    expect(isAdminRoute('/admin')).toBe(true);
    expect(isAdminRoute('/admin/courses')).toBe(true);
    expect(isAdminRoute('/dashboard/admin')).toBe(true);
    expect(isAdminRoute('/dashboard/superadmin')).toBe(true);
    expect(isAdminRoute('/dashboard/student')).toBe(false);

    expect(getLoginPathForRoute('/admin/question-bank')).toBe('/administration');
    expect(getLoginPathForRoute('/dashboard/superadmin')).toBe('/administration');
    expect(getLoginPathForRoute('/dashboard/student')).toBe('/login');
    expect(getLoginPathForRoute('/exam/abc')).toBe('/login');
  });

  it('sanitizes return URLs and prevents open redirects or auth param leaks', () => {
    expect(sanitizeReturnUrl('/admin/question-bank')).toBe(
      '/admin/question-bank',
    );
    expect(
      sanitizeReturnUrl('/admin/question-bank?subject=physics&page=2'),
    ).toBe('/admin/question-bank?subject=physics&page=2');
    expect(
      sanitizeReturnUrl(
        '/admin/courses?reason=session_expired&returnUrl=%2Fadmin&tab=active&token=secret',
      ),
    ).toBe('/admin/courses?tab=active');

    // Open redirect & malformed attempts
    expect(sanitizeReturnUrl('https://evil.com/admin')).toBeNull();
    expect(sanitizeReturnUrl('//evil.com/admin')).toBeNull();
    expect(sanitizeReturnUrl('/\\evil.com')).toBeNull();
    expect(sanitizeReturnUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeReturnUrl('/login')).toBeNull();
    expect(sanitizeReturnUrl('/administration')).toBeNull();
    expect(sanitizeReturnUrl('/api/auth/logout')).toBeNull();
    expect(sanitizeReturnUrl('/')).toBeNull();
  });

  it('restores authorized return destinations and falls back when unauthorized', () => {
    expect(
      resolvePostAuthDestination(adminSession, '/admin/question-bank'),
    ).toBe('/admin/question-bank');
    expect(
      resolvePostAuthDestination(superadminSession, '/dashboard/superadmin'),
    ).toBe('/dashboard/superadmin');
    expect(
      resolvePostAuthDestination(adminSession, '/dashboard/superadmin'),
    ).toBe('/admin');
    expect(
      resolvePostAuthDestination(studentSession, '/admin/question-bank'),
    ).toBe('/dashboard/student');
    expect(
      resolvePostAuthDestination(studentSession, '/exam/attempt-99'),
    ).toBe('/exam/attempt-99');
    expect(
      resolvePostAuthDestination(
        unpaidExternalStudentSession,
        '/dashboard/student',
      ),
    ).toBe('/plans');
    expect(
      resolvePostAuthDestination(adminSession, 'https://evil.com'),
    ).toBe('/admin');
  });

  it('maps auth notice codes cleanly without showing messages for logged_out', () => {
    expect(getAuthNoticeMessage('session_expired', 'admin')).toEqual({
      authError: '',
      sessionExpiredNotice:
        'Your administrative session has expired. Please sign in again with your credentials.',
    });
    expect(getAuthNoticeMessage('session_expired', 'student')).toEqual({
      authError: '',
      sessionExpiredNotice:
        'Your session has expired. Please sign in again to continue.',
    });
    expect(getAuthNoticeMessage('logged_out', 'admin')).toEqual({
      authError: '',
      sessionExpiredNotice: '',
    });
    expect(getAuthNoticeMessage('oauth_cancelled', 'student').authError).toContain(
      'cancelled',
    );
  });
});
