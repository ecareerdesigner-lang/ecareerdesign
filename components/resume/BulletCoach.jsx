"use client";
import { useEffect, useState } from "react";
import { Sparkles, Loader2, Check, Undo2 } from "lucide-react";
import { TOKENS } from "@/lib/design-tokens.js";
import { bulletCoachPrompt, bulletAnswerPrompt, parseBulletResults, introducesNewNumbers } from "@/lib/bullet-coach.js";

// Off unless NEXT_PUBLIC_BULLET_COACH=1 was set at build time. ?bulletcoach=1 / 0 overrides it for
// the current page load, for testing.
const DEFAULT = process.env.NEXT_PUBLIC_BULLET_COACH === "1";
export function useBulletCoach() {
  const [on, setOn] = useState(DEFAULT);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("bulletcoach");
    if (v === "1") setOn(true);
    if (v === "0") setOn(false);
  }, []);
  return on;
}

const btn = (primary) => ({
  display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
  padding: "7px 14px", borderRadius: 4, fontFamily: "inherit",
  border: `1px solid ${primary ? TOKENS.accent : TOKENS.line}`,
  background: primary ? TOKENS.accent : "transparent", color: primary ? "#fff" : TOKENS.ink,
});

// Suggests Action + Context + Result rewrites for the generated resume's bullets. When a bullet has
// no measurable result it asks the candidate for the real number, so nothing is ever invented.
// `ask(prompt, maxTokens)` is the app's normal Claude call; `data`/`setData` are the resume.
export default function BulletCoach({ data, setData, ask }) {
  const [phase, setPhase] = useState("idle"); // idle | loading | ready | error
  const [items, setItems] = useState({}); // key "j-b" -> { original, text, question, hasResult, applied, busy, note }
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");

  const bulletCount = (data?.workHistory || []).reduce((n, w) => n + (w.bullets?.length || 0), 0);
  if (!data?.workHistory?.length || bulletCount === 0) return null;

  async function analyze() {
    setPhase("loading");
    setError("");
    try {
      const jobs = data.workHistory.map((w, j) => ({
        job: j, title: w.title, employer: w.employer, current: /present/i.test(w.dates || ""),
        bullets: (w.bullets || []).map((text, b) => ({ bullet: b, text })),
      }));
      const reply = await ask(bulletCoachPrompt(jobs), 3500);
      const results = parseBulletResults(reply);
      const next = {};
      for (const r of results) {
        const original = data.workHistory[r.job]?.bullets?.[r.bullet];
        if (!original) continue;
        // Drop a rewrite that sneaks in a new figure; keep the question so the candidate can supply a real one.
        const unsafe = introducesNewNumbers(original, r.text);
        next[`${r.job}-${r.bullet}`] = { original, text: unsafe ? original : r.text, question: r.question, hasResult: r.hasResult, applied: false, busy: false, same: unsafe };
      }
      setItems(next);
      setPhase("ready");
    } catch (e) {
      setError("Couldn't review the bullets. Try again.");
      setPhase("error");
    }
  }

  function writeBullet(j, b, text) {
    setData((d) => ({
      ...d,
      workHistory: d.workHistory.map((w, wi) => (wi !== j ? w : { ...w, bullets: w.bullets.map((x, bi) => (bi === b ? text : x)) })),
    }));
  }

  function apply(key) {
    const [j, b] = key.split("-").map(Number);
    const it = items[key];
    if (!it || data.workHistory[j]?.bullets?.[b] !== it.original) return; // resume changed underneath us
    writeBullet(j, b, it.text);
    setItems((s) => ({ ...s, [key]: { ...s[key], applied: true } }));
  }
  function undo(key) {
    const [j, b] = key.split("-").map(Number);
    const it = items[key];
    if (!it) return;
    writeBullet(j, b, it.original);
    setItems((s) => ({ ...s, [key]: { ...s[key], applied: false } }));
  }
  function applyAll() {
    Object.keys(items).forEach((k) => { if (!items[k].applied && items[k].text !== items[k].original) apply(k); });
  }

  async function rewriteWithAnswer(key) {
    const [j, b] = key.split("-").map(Number);
    const it = items[key];
    const answer = (answers[key] || "").trim();
    if (!it || !answer) return;
    setItems((s) => ({ ...s, [key]: { ...s[key], busy: true, note: "" } }));
    try {
      const w = data.workHistory[j];
      const text = (await ask(bulletAnswerPrompt({ title: w.title, employer: w.employer, bullet: it.original, question: it.question, answer }), 400)).trim().replace(/^["']|["']$/g, "");
      if (!text || introducesNewNumbers(it.original, text, answer)) throw new Error("unsafe");
      setItems((s) => ({ ...s, [key]: { ...s[key], text, hasResult: true, question: null, busy: false, same: false } }));
    } catch (e) {
      setItems((s) => ({ ...s, [key]: { ...s[key], busy: false, note: "Couldn't use that answer. Try wording it with the exact figure." } }));
    }
  }

  const keys = Object.keys(items);
  const pending = keys.filter((k) => !items[k].applied && items[k].text !== items[k].original).length;
  const needNumbers = keys.filter((k) => !items[k].hasResult && items[k].question).length;

  return (
    <div style={{ border: `1px solid ${TOKENS.line}`, borderRadius: 4, padding: 16, margin: "0 0 12px", background: "#fff" }} aria-live="polite">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TOKENS.ink }}>Strengthen your bullets</p>
          <p style={{ margin: "2px 0 0", fontSize: 12.5, color: TOKENS.inkSoft }}>
            Rewrites each bullet as action + context + result, and asks you for real numbers instead of making any up.
          </p>
        </div>
        {phase !== "ready" && (
          <button type="button" style={btn(true)} onClick={analyze} disabled={phase === "loading"}>
            {phase === "loading" ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
            {phase === "loading" ? "Reviewing..." : "Review my bullets"}
          </button>
        )}
        {phase === "ready" && pending > 0 && (
          <button type="button" style={btn(true)} onClick={applyAll}>Use all {pending} suggestions</button>
        )}
      </div>
      {phase === "error" && <p role="alert" style={{ color: TOKENS.red, fontSize: 13, margin: "10px 0 0" }}>{error}</p>}

      {phase === "ready" && (
        <div style={{ marginTop: 14 }}>
          {needNumbers > 0 && (
            <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: "0 0 10px" }}>
              {needNumbers} bullet{needNumbers === 1 ? " has" : "s have"} no measurable result. Add a number only if you can back it up. Federal resumes are often verified.
            </p>
          )}
          {data.workHistory.map((w, j) => {
            const rows = (w.bullets || []).map((_, b) => [`${j}-${b}`, items[`${j}-${b}`]]).filter(([, it]) => it);
            if (!rows.length) return null;
            return (
              <div key={j} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: TOKENS.inkSoft, margin: "0 0 6px" }}>
                  {w.title}{w.employer ? `, ${w.employer}` : ""}
                </p>
                {rows.map(([key, it]) => {
                  const changed = it.text !== it.original;
                  return (
                    <div key={key} style={{ borderTop: `1px solid ${TOKENS.line}`, padding: "10px 0" }}>
                      {changed && <p style={{ margin: "0 0 4px", fontSize: 12.5, color: TOKENS.inkSoft, textDecoration: it.applied ? "none" : "line-through" }}>{it.original}</p>}
                      <p style={{ margin: 0, fontSize: 14, color: TOKENS.ink, lineHeight: 1.5 }}>{it.applied ? it.text : it.text}</p>
                      {!changed && !it.question && <p style={{ margin: "4px 0 0", fontSize: 12, color: TOKENS.inkSoft }}>Already strong. No change suggested.</p>}
                      {it.question && !it.hasResult && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                          <label htmlFor={`bc-${key}`} style={{ fontSize: 13, color: TOKENS.ink, fontWeight: 500, flex: "1 1 100%" }}>{it.question}</label>
                          <input
                            id={`bc-${key}`}
                            style={{ flex: "1 1 220px", padding: "7px 10px", border: `1px solid ${TOKENS.line}`, borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                            placeholder="Your real number or result"
                            value={answers[key] || ""}
                            onChange={(e) => setAnswers((a) => ({ ...a, [key]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") rewriteWithAnswer(key); }}
                          />
                          <button type="button" style={btn(false)} onClick={() => rewriteWithAnswer(key)} disabled={it.busy || !(answers[key] || "").trim()}>
                            {it.busy ? <Loader2 size={13} className="spin" /> : null} Rewrite with this
                          </button>
                          {it.note && <span role="alert" style={{ fontSize: 12.5, color: TOKENS.red, flex: "1 1 100%" }}>{it.note}</span>}
                        </div>
                      )}
                      {changed && (
                        <div style={{ marginTop: 8 }}>
                          {it.applied ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 12.5, color: TOKENS.inkSoft }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={13} /> Applied</span>
                              <button type="button" style={{ ...btn(false), padding: "3px 10px" }} onClick={() => undo(key)}><Undo2 size={12} /> Undo</button>
                            </span>
                          ) : (
                            <button type="button" style={btn(false)} onClick={() => apply(key)}>Use this</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
