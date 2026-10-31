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
      className="inline-flex items-center py-1.5 px-0.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#2525b8]/30 transition-opacity hover:opacity-90"
    >
      <Image
        src="/Isharp-Logo.webp"
        alt="I-Sharp Academy"
        width={314}
        height={115}
        className={cn("h-8.5 sm:h-9.5 w-auto object-contain", className)}
        priority={priority}
      />
    </Link>
  );
}
