export function hasPremium(profile) {
  if (!profile) return false;
  if (profile.is_premium) return true;
  if (!profile.premium_until) return false;
  return new Date(profile.premium_until) > new Date();
}

export function passDaysLeft(profile) {
  if (!profile?.premium_until) return null;
  const ms = new Date(profile.premium_until).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86400000);
}

export function nextPassEnd(currentEnd) {
  const now = Date.now();
  const existing = currentEnd ? new Date(currentEnd).getTime() : 0;
  const base = existing > now ? existing : now;
  return new Date(base + 30 * 86400000).toISOString();
}