import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="I-Sharp Academy home"
      className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-secondary/30 focus-visible:ring-offset-4 focus-visible:ring-offset-card"
    >
      <Image
        src="/Isharp-Logo.webp"
        alt="I-Sharp Academy"
        width={314}
        height={115}
        className={cn("h-auto w-40", className)}
        priority={priority}
      />
    </Link>
  );
}
