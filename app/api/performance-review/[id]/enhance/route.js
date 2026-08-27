import { NextResponse } from "next/server";
import { getSupabase, checkPremium } from "@/lib/performance-review-server.js";
import { REVIEW_PERIOD_LABELS, PERIOD_FRAMING } from "@/lib/performance-review-shared.js";

const SYSTEM_PROMPT = `You are helping a federal/postal employee write the overall "Accomplishments" narrative section of a formal performance review, pulling together everything across all their goals. Write in FIRST PERSON, as the employee themselves — "I delivered...", "I built...", never "the employee" or third person.

You will receive:
- The review period (mid-year, end of year, or end of position)
- A list of goals, each with its tasks/targets and a short summary the employee wrote
- The employee's own rough notes about their accomplishments

Write a polished, natural-sounding first-person narrative (one flowing write-up, or a short paragraph per goal if that reads better) that a real supervisor could read as the employee's own account. Do not write it as a bulleted checklist. Do not sound robotic or use corporate buzzword soup — write like a person describing real work.

The narrative MUST satisfy this rating standard:
1. It must show I met all standard "Fully Successful" expectations for each goal.
2. It must also clearly demonstrate AT LEAST TWO of the following three things, woven naturally into the writing (do not label or list them — show them through specific, concrete detail pulled from what was actually given to you):
   a. surpassed_outcomes — I surpassed most of the outcomes/targets tied to the goal, not merely met them.
   b. unique_contribution — my work product went beyond expectations in a way that included a special or unique contribution to the organization/unit.
   c. extraordinary_effort — I put forth extraordinary effort toward the goal.

Only claim things that are supported by the goals, tasks, and notes provided — never invent accomplishments, numbers, or outcomes that weren't given to you. If the notes are thin for a goal, write an honest, solid paragraph for it and simply don't force an unsupported claim.

Call the submit_enhanced_narrative tool with your result. Use a real blank line (two newlines) between paragraphs in the narrative text.`;

// Structured output via tool use, not hand-written JSON. A model asked to
// type valid JSON as plain text has to manually escape every newline in a
// multi-paragraph narrative as "\n" — the one section generating genuine
// flowing prose is exactly the one most likely to slip and emit a real
// line break instead, which is invalid inside a JSON string and is what
// "Could not parse AI response" actually was. Forcing a tool call moves
// the JSON structuring into Anthropic's API itself, which parses it
// server-side — there is no text for a regex-and-JSON.parse step to get
// wrong, because there is no longer a JSON.parse step at all.
const NARRATIVE_TOOL = {
  name: "submit_enhanced_narrative",
  description: "Submit the polished performance review narrative.",
  input_schema: {
    type: "object",
    properties: {
      narrative: {
        type: "string",
        description:
          "The full first-person write-up as plain text, with a real blank line between paragraphs.",
      },
      elements_demonstrated: {
        type: "array",
        items: {
          type: "string",
          enum: ["surpassed_outcomes", "unique_contribution", "extraordinary_effort"],
        },
        description:
          "Which of the three elements the narrative demonstrates (at least two).",
      },
    },
    required: ["narrative", "elements_demonstrated"],
  },
};

export async function POST(req, { params }) {
  const body = await req.json();
  const { userId } = body;

  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  if (!(await checkPremium(userId))) {
    return NextResponse.json({ error: "Premium required." }, { status: 403 });
  }

  const supabase = getSupabase();

  const { data: review, error: reviewErr } = await supabase
    .from("performance_reviews")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (reviewErr || !review) {
    return NextResponse.json({ error: "Review not found." }, { status: 404 });
  }

  const { data: goals } = await supabase
    .from("performance_goals")
    .select("*")
    .eq("review_id", params.id)
    .order("sort_order", { ascending: true });

  const goalIds = (goals ?? []).map((g) => g.id);
  const { data: tasks } = goalIds.length
    ? await supabase.from("performance_goal_tasks").select("*").in("goal_id", goalIds)
    : { data: [] };

  if (!goals || goals.length < 3) {
    return NextResponse.json({ error: "At least 3 goals are required before enhancing." }, { status: 400 });
  }

  const goalsBlock = goals
    .map((g, i) => {
      const goalTasks = (tasks ?? [])
        .filter((t) => t.goal_id === g.id)
        .map((t) => `    - ${t.task_text}`)
        .join("\n");
      return `Goal ${i + 1}: ${g.goal_text}\n  Tasks/Targets:\n${goalTasks}\n  Employee's summary: ${g.summary_text || "(none provided)"}`;
    })
    .join("\n\n");

  const userPrompt = `Review period: ${REVIEW_PERIOD_LABELS[review.review_period]}
${PERIOD_FRAMING[review.review_period]}

${goalsBlock}

Employee's raw accomplishment notes:
${review.accomplishments_raw || "(none provided)"}`;

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
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      tools: [NARRATIVE_TOOL],
      tool_choice: { type: "tool", name: "submit_enhanced_narrative" },
    }),
  });

  if (!claudeRes.ok) {
    const errText = await claudeRes.text();
    return NextResponse.json({ error: `AI request failed: ${errText}` }, { status: 502 });
  }

  const claudeData = await claudeRes.json();
  const toolUseBlock = claudeData.content?.find((b) => b.type === "tool_use");

  // Anthropic's API guarantees this input matches input_schema when
  // tool_choice forces this specific tool — no JSON.parse, no cleanup
  // regex, nothing left that a stray newline could break.
  if (!toolUseBlock?.input?.narrative) {
    return NextResponse.json({ error: "AI did not return the expected response." }, { status: 502 });
  }

  const parsed = toolUseBlock.input;

  await supabase
    .from("performance_reviews")
    .update({
      accomplishments_enhanced: parsed.narrative,
      elements_demonstrated: parsed.elements_demonstrated,
    })
    .eq("id", params.id);

  return NextResponse.json(parsed);
}
