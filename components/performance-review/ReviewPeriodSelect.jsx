"use client";

import { REVIEW_PERIOD_LABELS } from "@/lib/performance-review-shared.js";
import { TOKENS } from "@/lib/design-tokens.js";

const OPTIONS = ["mid_year", "end_of_year", "end_of_position"];

export function ReviewPeriodSelect({ value, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
      {OPTIONS.map((period) => {
        const active = value === period;
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            style={{
              textAlign: "left",
              padding: "16px",
              borderRadius: 12,
              border: active ? `2px solid ${TOKENS.accent}` : `1px solid ${TOKENS.line}`,
              background: active ? TOKENS.accentSoft : TOKENS.surface,
              boxShadow: active ? TOKENS.shadowHover : TOKENS.shadow,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: active ? TOKENS.ink : TOKENS.inkSoft }}>
              {REVIEW_PERIOD_LABELS[period]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
