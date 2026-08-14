import { REVIEW_PERIOD_LABELS } from "./performance-review-shared.js";

// Builds the plain-text version of a review, used for "Copy as text" and
// as the fallback body when emailing (matching the pattern in
// components/ECareerDesign.jsx's /api/subscribe usage).
export function formatReviewAsText(review) {
  const lines = [];
  lines.push(`Performance Review — ${REVIEW_PERIOD_LABELS[review.review_period]}`);
  lines.push("");

  review.goals.forEach((goal, i) => {
    lines.push(`Goal ${i + 1}: ${goal.goal_text || "(untitled)"}`);
    if (goal.tasks?.length) {
      lines.push("Tasks/Targets:");
      goal.tasks.forEach((t) => {
        if (t.task_text) lines.push(`  - ${t.task_text}`);
      });
    }
    if (goal.enhanced_summary) {
      lines.push("");
      lines.push(goal.enhanced_summary);
    } else if (goal.summary_text) {
      lines.push("");
      lines.push(goal.summary_text);
    }
    lines.push("");
  });

  lines.push("Accomplishments");
  lines.push(review.accomplishments_enhanced || review.accomplishments_raw || "(none provided)");

  return lines.join("\n");
}
