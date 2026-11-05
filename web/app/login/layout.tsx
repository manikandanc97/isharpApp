import type { ReactNode } from "react";

import { GuestOnlyLayout } from "@/components/guest-only-layout";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <GuestOnlyLayout>{children}</GuestOnlyLayout>;
}
