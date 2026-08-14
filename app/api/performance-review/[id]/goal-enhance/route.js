import { NextResponse } from "next/server";
import { getSupabase, checkPremium } from "@/lib/performance-review-server.js";
import { REVIEW_PERIOD_LABELS, PERIOD_FRAMING } from "@/lib/performance-review-shared.js";

const SYSTEM_PROMPT = `You are helping a federal/postal employee write the narrative for ONE specific goal on their formal performance review. Write in FIRST PERSON, as the employee themselves — "I delivered...", "I built...", never "the employee" or third person.

You will receive:
- The review period
- This one goal's text
- The tasks/targets under it
- The employee's own short summary of their performance on this goal

Write a polished, natural-sounding first-person paragraph (or two, if needed) a real supervisor could read as this employee's own account. Do not write it as a bulleted checklist. Do not sound robotic or use corporate buzzword soup — write like a person describing real work.

The narrative MUST satisfy this rating standard FOR THIS GOAL:
1. It must show I met all standard "Fully Successful" expectations for this goal.
2. It must also clearly demonstrate AT LEAST TWO of the following three things, woven naturally into the writing (do not label or list them — show them through specific, concrete detail pulled from what was actually given to you):
   a. surpassed_outcomes — I surpassed most of the outcomes/targets tied to this goal, not merely met them.
   b. unique_contribution — my work product went beyond expectations in a way that included a special or unique contribution to the organization/unit.
   c. extraordinary_effort — I put forth extraordinary effort toward this goal.

Only claim things supported by what's given to you — never invent accomplishments, numbers, or outcomes. If the notes are thin, write an honest, solid paragraph and don't force an unsupported claim.

Respond with ONLY valid JSON, no markdown fences, no preamble:
{
  "narrative": "the full first-person write-up as plain text",
  "elements_demonstrated": ["surpassed_outcomes" | "unique_contribution" | "extraordinary_effort", ...]
}`;

export async function POST(req, { params }) {
  const body = await req.json();
  const { userId, goalId } = body;

  if (!userId || !goalId) {
    return NextResponse.json({ error: "Missing userId or goalId." }, { status: 400 });
  }
  if (!(await checkPremium(userId))) {
    return NextResponse.json({ error: "Premium required." }, { status: 403 });
  }

  const supabase = getSupabase();

  // Confirm the review belongs to this user, and pull period for context
  const { data: review, error: reviewErr } = await supabase
    .from("performance_reviews")
    .select("id, review_period")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (reviewErr || !review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  // Confirm the goal belongs to this review
  const { data: goal, error: goalErr } = await supabase
    .from("performance_goals")
    .select("*")
    .eq("id", goalId)
    .eq("review_id", params.id)
    .single();

  if (goalErr || !goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const { data: tasks } = await supabase
    .from("performance_goal_tasks")
    .select("*")
    .eq("goal_id", goalId)
    .order("sort_order", { ascending: true });

  const tasksBlock = (tasks ?? []).map((t) => `  - ${t.task_text}`).join("\n") || "  (none listed)";

  const userPrompt = `Review period: ${REVIEW_PERIOD_LABELS[review.review_period]}
${PERIOD_FRAMING[review.review_period]}

Goal: ${goal.goal_text}

Tasks/Targets:
${tasksBlock}

My summary of my performance on this goal:
${goal.summary_text || "(none provided)"}`;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Server missing ANTHROPIC_API_KEY." }, { status: 500 });
  }

  const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return NextResponse.json({ error: `AI request failed: ${errText}` }, { status: 502 });
  }

  const claudeData = await claudeRes.json();
  const textBlock = claudeData.content?.find((b) => b.type === "text");
  if (!textBlock?.text) {
    return NextResponse.json({ error: "AI returned no text." }, { status: 502 });
  }

  let parsed;
  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response." }, { status: 502 });
  }

  await supabase
    .from("performance_goals")
    .update({
      enhanced_summary: parsed.narrative,
      elements_demonstrated: parsed.elements_demonstrated,
    })
    .eq("id", goalId);

  return NextResponse.json(parsed);
}
