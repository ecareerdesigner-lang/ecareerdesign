"use client";

import { forwardRef } from "react";
import { REVIEW_PERIOD_LABELS } from "@/lib/performance-review-shared.js";
import { TOKENS } from "@/lib/design-tokens.js";

// The visible, on-screen preview AND the exact element captured for PDF
// export (same approach as Resume Builder's export step - one element
// serves both purposes).
export const ReviewPreview = forwardRef(function ReviewPreview({ review }, ref) {
  return (
    <div
      ref={ref}
      style={{
        background: TOKENS.surface,
        borderRadius: 16,
        padding: 32,
        boxShadow: TOKENS.shadow,
        maxWidth: 720,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: TOKENS.accent, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" }}>
        {REVIEW_PERIOD_LABELS[review.review_period]} Performance Review
      </p>

      {review.goals.map((goal, i) => (
        <div key={goal.id} style={{ marginBottom: 24 }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, margin: "0 0 6px", color: TOKENS.ink }}>
            Goal {i + 1}: {goal.goal_text || "(untitled)"}
          </h3>
          {goal.tasks?.some((t) => t.task_text) && (
            <ul style={{ margin: "0 0 8px", paddingLeft: 20 }}>
              {goal.tasks.map(
                (t) =>
                  t.task_text && (
                    <li key={t.id} style={{ fontSize: 13.5, color: TOKENS.inkSoft, marginBottom: 2 }}>
                      {t.task_text}
                    </li>
                  )
              )}
            </ul>
          )}
          <p style={{ fontSize: 14, color: TOKENS.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
            {goal.enhanced_summary || goal.summary_text || "(no summary provided)"}
          </p>
        </div>
      ))}

      <div>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, margin: "0 0 6px", color: TOKENS.ink }}>
          Accomplishments
        </h3>
        <p style={{ fontSize: 14, color: TOKENS.ink, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
          {review.accomplishments_enhanced || review.accomplishments_raw || "(none provided)"}
        </p>
      </div>
    </div>
  );
});
