import type { ReactNode } from "react";

import { GuestOnlyLayout } from "@/components/guest-only-layout";

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return <GuestOnlyLayout>{children}</GuestOnlyLayout>;
}
