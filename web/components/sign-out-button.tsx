'use client';

import { useRouter } from 'next/navigation';
import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { LogoutConfirmationDialog } from '@/components/logout-confirmation-dialog';

export function SignOutButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setShowConfirm(false);
      router.replace('/login');
      router.refresh();
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
