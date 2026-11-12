"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Premium "Apply Assistant" card: shows the Chrome Web Store link (when configured), makes a pairing code,
// and lists the browsers that are connected, each with a Disconnect button.
const STORE_URL = process.env.NEXT_PUBLIC_EXTENSION_URL || "";

const C = { ink: "#14213d", soft: "#5a6580", line: "#d9dee8", orange: "#f27a1a", blue: "#1e5ac8", red: "#b42318", green: "#14663a" };

function ago(iso) {
  if (!iso) return "not used yet";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 90) return "just now";
  if (s < 5400) return `${Math.round(s / 60)} min ago`;
  if (s < 129600) return `${Math.round(s / 3600)} hours ago`;
  return `${Math.round(s / 86400)} days ago`;
}

async function authed(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Please sign in first.");
  const res = await fetch(path, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${session.access_token}` } });
  let body = {};
  try { body = await res.json(); } catch {}
  if (!res.ok) {
    const err = new Error(body.error || "Something went wrong. Please try again.");
    err.code = body.code;
    throw err;
  }
  return body;
}

export default function ExtensionConnect() {
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [conns, setConns] = useState([]);

  const loadConnections = useCallback(async () => {
    try {
      const { connections } = await authed("/api/extension/connections");
      setConns(connections || []);
    } catch {
      setConns([]);
    }
  }, []);

  useEffect(() => { loadConnections(); }, [loadConnections]);

  useEffect(() => {
    if (!code) return undefined;
    const tick = () => {
      const s = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) setCode("");
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [code, expiresAt]);

  async function makeCode() {
    setBusy(true); setErr(""); setCopied(false);
    try {
      const j = await authed("/api/extension/pair/start", { method: "POST" });
      setCode(j.code);
      setExpiresAt(new Date(j.expiresAt).getTime());
    } catch (e) {
      setCode("");
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  async function revoke(id) {
    setErr("");
    try {
      await authed(id ? `/api/extension/connections?id=${id}` : "/api/extension/connections?all=1", { method: "DELETE" });
      await loadConnections();
    } catch (e) {
      setErr(e.message);
    }
  }

  const btn = (primary) => ({
    background: primary ? C.blue : "#fff", color: primary ? "#fff" : C.ink, border: `1px solid ${primary ? C.blue : C.line}`,
    borderRadius: 8, padding: "9px 14px", fontWeight: 600, fontSize: 14, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
  });
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;

  return (
    <section aria-labelledby="ext-title" style={{ border: `1px solid ${C.line}`, borderTop: `4px solid ${C.orange}`, borderRadius: 12, padding: 18, background: "#fff", maxWidth: 560, fontFamily: "system-ui, sans-serif", color: C.ink }}>
      <h3 id="ext-title" style={{ margin: 0, fontSize: 17 }}>Apply Assistant <span style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: "uppercase", letterSpacing: ".05em", marginLeft: 6 }}>Premium</span></h3>
      <p style={{ margin: "6px 0 14px", color: C.soft, fontSize: 14, lineHeight: 1.5 }}>
        A Chrome extension that finds roles that fit your resume, writes a tailored resume and cover letter for each, and fills in the application.
        You review everything, and nothing is sent until you approve it.
      </p>

      <ol style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
        <li>
          Install the extension{" "}
          {STORE_URL
            ? <a href={STORE_URL} target="_blank" rel="noopener noreferrer" style={{ color: C.blue, fontWeight: 600 }}>Add to Chrome</a>
            : <span style={{ color: C.soft }}>(Chrome Web Store listing coming soon)</span>}
        </li>
        <li>Click <b>Get a pairing code</b> below.</li>
        <li>Open the extension's side panel in Chrome and paste the code.</li>
      </ol>

      <button onClick={makeCode} disabled={busy} style={btn(true)}>{busy ? "Making a code…" : code ? "Get a new code" : "Get a pairing code"}</button>

      {code && (
        <div style={{ marginTop: 14, padding: 14, background: "#f6f7fb", borderRadius: 10 }}>
          <div style={{ fontSize: 12, color: C.soft }}>Your code. It works once and expires in {mm}.</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 30, fontWeight: 800, letterSpacing: 4, color: C.blue, fontFamily: "ui-monospace, Consolas, monospace" }}>{code}</span>
            <button onClick={copy} style={{ ...btn(false), padding: "6px 12px" }}>{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      )}

      {err && <div role="alert" style={{ marginTop: 12, color: C.red, fontSize: 14 }}>{err}</div>}

      {conns.length > 0 && (
        <div style={{ marginTop: 18, borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Connected browsers</div>
          {conns.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "7px 0", fontSize: 14 }}>
              <div>
                <div>{c.label || "Chrome"}</div>
                <div style={{ fontSize: 12, color: C.soft }}>Connected {new Date(c.created_at).toLocaleDateString()} · last used {ago(c.last_used_at)}</div>
              </div>
              <button onClick={() => revoke(c.id)} style={{ ...btn(false), padding: "5px 10px", color: C.red }}>Disconnect</button>
            </div>
          ))}
          {conns.length > 1 && <button onClick={() => revoke(null)} style={{ background: "none", border: 0, color: C.soft, textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0, marginTop: 4 }}>Disconnect all</button>}
        </div>
      )}
    </section>
  );
}
