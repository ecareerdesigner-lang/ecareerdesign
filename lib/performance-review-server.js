import { createClient } from "@supabase/supabase-js";
import { hasPremium } from "./premium.js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}

// profiles has real RLS locking out the anon key (unlike our own
// performance_reviews/goals/tasks tables) - deliberately, since it holds
// premium status. Reading it server-side requires the service role key,
// same privileged key stripe-webhook already uses. This key must NEVER be
// sent to the browser - it only belongs in server-side files like this one.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}

export async function checkPremium(userId) {
  if (!userId) return false;
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("is_premium, premium_until")
    .eq("id", userId)
    .maybeSingle();
  return hasPremium(profile);
}

export { getSupabase };
