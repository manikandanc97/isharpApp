import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { getPostAuthDestination } from "@/lib/oauth-flow";
import { getServerAuthenticatedSession } from "@/lib/server-auth-session";

async function GuestOnlyContent({ children }: { children: ReactNode }) {
  // Session validation reads expiring JWT timestamps. Opt this boundary into
  // request-time rendering so those values are never evaluated at prerender.
  await connection();
  const session = await getServerAuthenticatedSession();
  if (session) redirect(getPostAuthDestination(session));
  return children;
}

export function GuestOnlyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <GuestOnlyContent>{children}</GuestOnlyContent>
    </Suspense>
  );
}
