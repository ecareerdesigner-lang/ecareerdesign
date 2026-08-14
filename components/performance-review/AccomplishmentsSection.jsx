"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ELEMENT_LABELS } from "@/lib/performance-review-shared.js";
import { TOKENS } from "@/lib/design-tokens.js";

const ELEMENT_KEYS = ["surpassed_outcomes", "unique_contribution", "extraordinary_effort"];

const textareaStyle = {
  width: "100%",
  fontSize: 16,
  padding: "14px",
  borderRadius: 10,
  border: `1px solid ${TOKENS.line}`,
  color: TOKENS.ink,
  lineHeight: 1.5,
  resize: "vertical",
  boxSizing: "border-box",
};

export function AccomplishmentsSection({
  reviewId,
  userId,
  rawText,
  enhancedText,
  elementsDemonstrated,
  onRawChange,
  onEnhanced,
  goalCount,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enhance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/performance-review/${reviewId}/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      onEnhanced(data.narrative, data.elements_demonstrated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const meetsBar = elementsDemonstrated.length >= 2;

  return (
    <div style={{ background: TOKENS.surface, borderRadius: 16, padding: 24, boxShadow: TOKENS.shadow }}>
      <label style={{ fontSize: 14, fontWeight: 600, color: TOKENS.inkSoft, display: "block", marginBottom: 6 }}>
        Accomplishments
      </label>
      <p style={{ fontSize: 13.5, color: TOKENS.inkSoft, margin: "0 0 10px", lineHeight: 1.5 }}>
        Tell us about your accomplishments this period, in your own words. The AI will polish this
        into a formal narrative.
      </p>
      <textarea
        value={rawText}
        onChange={(e) => onRawChange(e.target.value)}
        rows={7}
        placeholder="Write freely — bullet points, half sentences, whatever comes to mind..."
        style={textareaStyle}
      />

      <button
        type="button"
        onClick={enhance}
        disabled={loading || goalCount < 3}
        style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 14,
          background: TOKENS.accent, color: "#fff", border: "none",
          borderRadius: 10, padding: "12px 20px", fontSize: 14, fontWeight: 600,
          cursor: loading || goalCount < 3 ? "default" : "pointer",
          opacity: loading || goalCount < 3 ? 0.55 : 1,
        }}
      >
        <Sparkles size={16} />
        {loading ? "Enhancing..." : "Enhance with AI"}
      </button>

      {goalCount < 3 && (
        <p style={{ fontSize: 13, color: TOKENS.gold, marginTop: 8 }}>Add at least 3 goals above before enhancing.</p>
      )}
      {error && <p style={{ fontSize: 13, color: TOKENS.red, marginTop: 8 }}>{error}</p>}

      {enhancedText && (
        <div style={{ marginTop: 18, background: TOKENS.paper, borderRadius: 12, padding: 18 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {ELEMENT_KEYS.map((el) => {
              const hit = elementsDemonstrated.includes(el);
              return (
                <span
                  key={el}
                  style={{
                    fontSize: 12.5, fontWeight: 600, borderRadius: 999, padding: "4px 10px",
                    background: hit ? "#E4F0E9" : "#EDEDED",
                    color: hit ? TOKENS.green : "#9AA3A0",
                  }}
                >
                  {hit ? "✓" : "○"} {ELEMENT_LABELS[el]}
                </span>
              );
            })}
          </div>

          {!meetsBar && (
            <p style={{ fontSize: 13, color: TOKENS.gold, marginBottom: 12 }}>
              Only {elementsDemonstrated.length} of 2 required elements were clearly supported by
              what you provided. Add more detail above and re-enhance for a stronger write-up.
            </p>
          )}

          <textarea
            value={enhancedText}
            onChange={(e) => onEnhanced(e.target.value, elementsDemonstrated)}
            rows={10}
            style={{ ...textareaStyle, background: TOKENS.surface }}
          />
          <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, marginTop: 6 }}>
            Feel free to edit this by hand — it's yours now.
          </p>
        </div>
      )}
    </div>
  );
}
