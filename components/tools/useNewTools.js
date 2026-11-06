"use client";
import { useEffect, useState } from "react";

// Same switch as the builder screens: OFF unless NEXT_PUBLIC_NEW_TOOLS=1 was set at build time.
// ?newtools=1 / ?newtools=0 overrides it for the current page load, for testing.
const DEFAULT = process.env.NEXT_PUBLIC_NEW_TOOLS === "1";

export function useNewTools() {
  const [on, setOn] = useState(DEFAULT);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("newtools");
    if (v === "1") setOn(true);
    if (v === "0") setOn(false);
  }, []);
  return on;
}
