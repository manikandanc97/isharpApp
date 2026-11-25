import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";

import { resolvePostAuthDestination } from "@/lib/auth-redirect";
import { readAuthRedirectCookiesFromStore } from "@/lib/auth-redirect-cookies";
import { getServerAuthenticatedSession } from "@/lib/server-auth-session";

async function GuestOnlyContent({ children }: { children: ReactNode }) {
  // Session validation reads expiring JWT timestamps. Opt this boundary into
  // request-time rendering so those values are never evaluated at prerender.
  await connection();
  const session = await getServerAuthenticatedSession();
  if (session) {
    const { returnUrl } = await readAuthRedirectCookiesFromStore();
    redirect(resolvePostAuthDestination(session, returnUrl));
  }
  return children;
}

export function GuestOnlyLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <GuestOnlyContent>{children}</GuestOnlyContent>
    </Suspense>
  );
}
