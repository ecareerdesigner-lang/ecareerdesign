import { createClient } from '@supabase/supabase-js';

let _client: ReturnType<typeof createClient> | null = null;

function client() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

/**
 * fetch() for /api/business/* that attaches the signed-in user's access token.
 * The server (middleware.ts) rejects requests without a valid admin session.
 */
export async function bfetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await client().auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
