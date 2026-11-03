import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const legacySection = url.searchParams.get("section");

  if (
    url.pathname === "/admin" &&
    (legacySection === "overview" ||
      legacySection === "students" ||
      legacySection === "courses")
  ) {
    url.pathname =
      legacySection === "overview" ? "/admin" : `/admin/${legacySection}`;
    url.searchParams.delete("section");
    return NextResponse.redirect(url);
  }

  if (url.pathname === "/admin/overview") {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
