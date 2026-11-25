'use client';

import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { LogoutConfirmationDialog } from '@/components/logout-confirmation-dialog';
import { getLoginPathForRoute } from '@/lib/auth-redirect';
import { handleSessionExpired } from '@/lib/session-manager';

export function SignOutButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      setShowConfirm(false);
      const destination =
        typeof window !== 'undefined'
          ? getLoginPathForRoute(window.location.pathname)
          : '/login';
      await handleSessionExpired({
        destination,
        reason: 'logged_out',
      });
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <>
      <Button
        {...props}
        type="button"
        variant="outline"
        onClick={(event) => {
          props.onClick?.(event);
          if (event.defaultPrevented) return;
          setShowConfirm(true);
        }}
      >
        {children}
      </Button>

      <LogoutConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}
