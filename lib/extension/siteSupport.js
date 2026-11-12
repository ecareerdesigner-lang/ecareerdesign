// Works out how well the extension can fill a job link, using only the link's own domain.
// This deliberately makes NO network requests: following job links from the server looks like
// bot traffic to the job sites and can get an IP address blocked.
// level: "good" (tuned adapter), "partial" (sign-in or wizard), "manual" (not supported), "unknown"
export function classify(url) {
  let host = "";
  try { host = new URL(url).hostname.toLowerCase(); } catch { return { level: "unknown", label: "Form type unknown" }; }
  const is = (d) => host === d || host.endsWith("." + d);

  if (is("greenhouse.io")) return { level: "good", label: "Auto-fill supported" };
  if (is("lever.co")) return { level: "good", label: "Auto-fill supported" };
  if (is("ashbyhq.com")) return { level: "good", label: "Auto-fill supported" };
  if (is("myworkdayjobs.com")) return { level: "partial", label: "Needs your account, partial fill" };
  if (is("amazon.jobs") || is("hiring.amazon.com")) return { level: "partial", label: "Needs your account" };
  if (is("linkedin.com") || is("indeed.com")) return { level: "manual", label: "Apply on the site yourself" };
  if (is("usajobs.gov") || is("usastaffing.gov")) return { level: "manual", label: "Apply in USAJOBS yourself (download your resume here)" };
  if (is("jooble.org") || is("adzuna.com")) return { level: "unknown", label: "Opens a job-board page first" };
  return { level: "unknown", label: "Form type unknown" };
}

export async function resolveSupport(url) {
  return classify(url);
}
