import { NextResponse } from "next/server";
import { getSupabase, checkPremium } from "@/lib/performance-review-server.js";
import { logError } from "@/lib/logError.js";

const VALID_PERIODS = ["mid_year", "end_of_year", "end_of_position"];

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, review_period, title } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }
    if (!VALID_PERIODS.includes(review_period)) {
      return NextResponse.json({ error: "Invalid review period." }, { status: 400 });
    }
    if (!(await checkPremium(userId))) {
      return NextResponse.json({ error: "Premium required." }, { status: 403 });
    }

    const supabase = getSupabase();

    const { data: review, error: reviewErr } = await supabase
      .from("performance_reviews")
      .insert({ user_id: userId, review_period, title: title ?? "" })
      .select()
      .single();

    if (reviewErr) {
      await logError({ source: "server", feature: "performance-review-create", message: reviewErr.message, context: { stage: "insert-review" } });
      return NextResponse.json({ error: reviewErr.message }, { status: 500 });
    }

    const goalRows = [0, 1, 2].map((sort_order) => ({
      review_id: review.id,
      goal_text: "",
      summary_text: "",
      sort_order,
    }));

    const { data: goals, error: goalsErr } = await supabase
      .from("performance_goals")
      .insert(goalRows)
      .select();

    if (goalsErr) {
      await logError({ source: "server", feature: "performance-review-create", message: goalsErr.message, context: { reviewId: review.id, stage: "insert-goals" } });
      return NextResponse.json({ error: goalsErr.message }, { status: 500 });
    }

    const taskRows = goals.map((g) => ({ goal_id: g.id, task_text: "", sort_order: 0 }));
    await supabase.from("performance_goal_tasks").insert(taskRows);

    return NextResponse.json({ id: review.id });
  } catch (e) {
    await logError({ source: "server", feature: "performance-review-create", message: e.message, stack: e.stack });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
