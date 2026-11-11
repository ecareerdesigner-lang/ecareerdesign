"use client";

import { analytics } from "@heycatch/sdk";

// Module scope: runs once per page load on the client, on every page.
analytics.init({
  projectKey: "hck_pk_6jA_c7RkIELo-eTr7MMmMyOIHfVt-qYK",
  site: "landing",
  requestBatching: false, // multi-page site
  install: {
    framework: "nextjs",
    frameworkVersion: "14",
    agent: "claude-code",
  },
});

export default function HeyCatchInit() {
  return null;
}
