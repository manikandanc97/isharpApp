"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Resets the window scroll position to the top whenever the route pathname
 * changes, bypassing CSS smooth-scroll so new screens never open mid-page.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }
    if (previousPathnameRef.current === pathname) {
      return;
    }
    previousPathnameRef.current = pathname;

    if (window.location.hash) {
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
