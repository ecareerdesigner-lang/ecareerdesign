import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protects every /api/business/* route.
 *
 * The Business Center API used to be open to anyone who knew the URL (it used
 * the public anon key with no auth check). Now each request must carry the
 * signed-in user's Supabase access token as `Authorization: Bearer <token>`,
 * and that user's profile must have role admin/superadmin.
 *
 * The routes themselves use the service role key (server-only), which is what
 * lets RLS stay enabled on the business tables with no public policies.
 */
export const config = {
  matcher: ['/api/business/:path*'],
};

function deny(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return deny(500, 'Server misconfigured');

  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!token) return deny(401, 'Authentication required');

  // 1. Validate the token with Supabase Auth.
  const userRes = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!userRes.ok) return deny(401, 'Invalid or expired session');
  const user = await userRes.json();
  if (!user?.id) return deny(401, 'Invalid or expired session');

  // 2. Check the role server-side (service role bypasses RLS on profiles).
  const profRes = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    }
  );
  if (!profRes.ok) return deny(403, 'Unable to verify role');
  const rows = await profRes.json();
  const role = rows?.[0]?.role;
  if (role !== 'admin' && role !== 'superadmin') return deny(403, 'Admin access required');

  return NextResponse.next();
}
