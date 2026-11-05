import type { ComponentProps } from "react";
import { cn } from "cn";

type ContainerSize = "content" | "workspace" | "readable";
type StackGap = "xs" | "sm" | "md" | "lg" | "section";

export function PageContainer({
  className,
  size = "content",
  ...props
}: ComponentProps<"div"> & { size?: ContainerSize }) {
  return (
    <div
      className={cn("layout-container", className)}
      data-size={size}
      {...props}
    />
  );
}

export function PageContent({ className, ...props }: ComponentProps<"main">) {
  return <main className={cn("min-w-0 flex-1", className)} {...props} />;
}

export function ContentSection({
  className,
  spacing = "default",
  ...props
}: ComponentProps<"section"> & { spacing?: "default" | "compact" }) {
  return (
    <section
      className={cn("layout-section", className)}
      data-spacing={spacing}
      {...props}
    />
  );
}

export function Stack({
  className,
  gap = "md",
  ...props
}: ComponentProps<"div"> & { gap?: StackGap }) {
  return (
    <div className={cn("layout-stack", className)} data-gap={gap} {...props} />
  );
}

export function Inline({
  className,
  nowrap = false,
  ...props
}: ComponentProps<"div"> & { nowrap?: boolean }) {
  return (
    <div
      className={cn("layout-inline", className)}
      data-nowrap={nowrap || undefined}
      {...props}
    />
  );
}

export function ResponsiveGrid({
  className,
  min = "md",
  ...props
}: ComponentProps<"div"> & { min?: "sm" | "md" | "lg" }) {
  return (
    <div className={cn("layout-grid", className)} data-min={min} {...props} />
  );
}

export function CardLayout({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("layout-card", className)} {...props} />;
}

export function PageHeader({ className, ...props }: ComponentProps<"header">) {
  return <header className={cn("layout-page-header", className)} {...props} />;
}
