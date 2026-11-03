import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      data-slot="skeleton"
      data-shimmer={shimmer ? "true" : undefined}
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/75 dark:bg-slate-800/70",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonStatus({
  children,
  className,
  label = "Loading content",
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={className}
      role="status"
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

