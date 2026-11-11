"use client";
import { useEffect, useState } from "react";

// Switch for the redesigned public (marketing) pages. OFF unless NEXT_PUBLIC_NEW_PUBLIC_PAGES=1
// was set at build time (Next.js bakes NEXT_PUBLIC_ values in, so changing it needs a redeploy).
// ?newpages=1 / ?newpages=0 overrides it for the current page load, for testing.
const DEFAULT = process.env.NEXT_PUBLIC_NEW_PUBLIC_PAGES === "1";

export function usePublicRedesign() {
  const [on, setOn] = useState(DEFAULT);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("newpages");
    if (v === "1") setOn(true);
    if (v === "0") setOn(false);
  }, []);
  return on;
}
