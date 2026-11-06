"use client";
import ToolsChrome, { TOOLS_FONT_CLASS } from "./ToolsChrome";

// Page shell for tool screens that live on their own route (not inside the main app component):
// sticky bar + photo band + a centered content column, with the same skin as the builder screens.
export default function ToolsPage({ band, onHome, onLogout, maxWidth = 760, children }) {
  return (
    <div className={`nt ${TOOLS_FONT_CLASS}`} style={{ fontFamily: "'Inter', sans-serif" }}>
      <ToolsChrome band={band} homeLabel="← Dashboard" onHome={onHome} onLogout={onLogout} showLogout />
      <div style={{ maxWidth, margin: "0 auto", padding: "2rem 1.5rem 3.5rem" }}>{children}</div>
    </div>
  );
}
