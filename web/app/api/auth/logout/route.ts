import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // An unavailable auth service should not trap the browser on a protected page.
  }

  return Response.json(
    { signedOut: true },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
