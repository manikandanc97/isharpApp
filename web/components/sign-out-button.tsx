'use client';

import { useRouter } from 'next/navigation';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export function SignOutButton({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const router = useRouter();
  return (
    <Button
      {...props}
      type="button"
      variant="outline"
      onClick={async (event) => {
        props.onClick?.(event);
        if (event.defaultPrevented) return;
        await fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
        router.refresh();
      }}
    >
      {children}
    </Button>
  );
}
