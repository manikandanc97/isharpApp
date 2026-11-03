import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonLinesProps = {
  className?: string;
  lineClassName?: string;
  widths?: readonly string[];
};

export function SkeletonLines({
  className,
  lineClassName,
  widths = ["w-full", "w-4/5"],
}: SkeletonLinesProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {widths.map((width, index) => (
        <Skeleton
          key={`${width}-${index}`}
          className={cn("h-3.5", width, lineClassName)}
        />
      ))}
    </div>
  );
}

export function SkeletonSectionHeading({ dark = false }: { dark?: boolean }) {
  const tone = dark ? "bg-slate-700" : undefined;

  return (
    <div className="max-w-2xl">
      <Skeleton className={cn("h-6 w-36 rounded-full", tone)} />
      <Skeleton className={cn("mt-3 h-8 w-full max-w-xl rounded-lg", tone)} />
      <Skeleton className={cn("mt-2 h-8 w-3/4 max-w-md rounded-lg", tone)} />
      <Skeleton className={cn("mt-3 h-3.5 w-full max-w-lg", tone)} />
    </div>
  );
}

export const skeletonItems = (count: number) =>
  Array.from({ length: count }, (_, index) => index);
