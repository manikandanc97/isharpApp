import {
  AchievementSkeleton,
  CoursesSkeleton,
  FeatureSkeleton,
  JourneySkeleton,
} from "@/components/skeletons/site/site-section-skeletons";
import {
  FooterSkeleton,
  HeroSkeleton,
  SiteHeaderSkeleton,
} from "@/components/skeletons/site/site-shell-skeleton";
import { SkeletonStatus } from "@/components/ui/skeleton";

export function SiteLayoutSkeleton() {
  return (
    <SkeletonStatus
      label="Loading academy website"
      className="flex min-h-screen flex-col bg-white"
    >
      <SiteHeaderSkeleton />
      <main className="flex flex-1 flex-col">
        <HeroSkeleton />
        <FeatureSkeleton />
        <AchievementSkeleton />
        <JourneySkeleton />
        <CoursesSkeleton />
      </main>
      <FooterSkeleton />
    </SkeletonStatus>
  );
}
