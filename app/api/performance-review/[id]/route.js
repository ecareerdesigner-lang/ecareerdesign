import { NextResponse } from "next/server";
import { getSupabase, checkPremium } from "@/lib/performance-review-server.js";
import { logError } from "@/lib/logError.js";

export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

    const supabase = getSupabase();

    const { data: review, error } = await supabase
      .from("performance_reviews")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (error || !review) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const { data: goals } = await supabase
      .from("performance_goals")
      .select("*")
      .eq("review_id", params.id)
      .order("sort_order", { ascending: true });

    const goalIds = (goals ?? []).map((g) => g.id);

    const { data: tasks } = goalIds.length
      ? await supabase
          .from("performance_goal_tasks")
          .select("*")
          .in("goal_id", goalIds)
          .order("sort_order", { ascending: true })
      : { data: [] };

    const shaped = {
      id: review.id,
      review_period: review.review_period,
      title: review.title ?? "",
      accomplishments_raw: review.accomplishments_raw ?? "",
      accomplishments_enhanced: review.accomplishments_enhanced ?? "",
      elements_demonstrated: review.elements_demonstrated ?? [],
      status: review.status,
      updated_at: review.updated_at,
      goals: (goals ?? []).map((g) => ({
        id: g.id,
        goal_text: g.goal_text ?? "",
        summary_text: g.summary_text ?? "",
        enhanced_summary: g.enhanced_summary ?? "",
        elements_demonstrated: g.elements_demonstrated ?? [],
        sort_order: g.sort_order,
        tasks: (tasks ?? [])
          .filter((t) => t.goal_id === g.id)
          .map((t) => ({ id: t.id, task_text: t.task_text ?? "", sort_order: t.sort_order })),
      })),
    };

    return NextResponse.json(shaped);
  } catch (e) {
    await logError({ source: "server", feature: "performance-review-get", message: e.message, stack: e.stack, context: { reviewId: params?.id } });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/**
 * Saves the whole review tree in one call (autosave target). Upserts by ID
 * instead of delete-and-reinsert, so goal/task IDs stay stable across
 * saves — the per-goal AI enhance depends on that ID staying valid.
 */
export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const { userId, ...review } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    if (!review.goals || review.goals.length < 3) {
      return NextResponse.json({ error: "At least 3 goals are required." }, { status: 400 });
    }
    for (const g of review.goals) {
      if (!g.tasks || g.tasks.length < 1) {
        return NextResponse.json({ error: "Each goal needs at least 1 task." }, { status: 400 });
      }
    }

    const supabase = getSupabase();

    const { data: existing, error: ownErr } = await supabase
      .from("performance_reviews")
      .select("id")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (ownErr || !existing) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }

    const { error: reviewErr } = await supabase
      .from("performance_reviews")
      .update({
        review_period: review.review_period,
        title: review.title,
        accomplishments_raw: review.accomplishments_raw,
        status: review.status,
      })
      .eq("id", params.id);

    if (reviewErr) {
      await logError({ source: "server", feature: "performance-review-put", message: reviewErr.message, context: { reviewId: params.id, stage: "update-review" } });
      return NextResponse.json({ error: reviewErr.message }, { status: 500 });
    }

    // Remove goals the user deleted client-side, then upsert the rest by ID
    // so unchanged/edited goals keep their existing ID (cascades to tasks).
    const { data: existingGoals } = await supabase
      .from("performance_goals")
      .select("id")
      .eq("review_id", params.id);

    const existingGoalIds = (existingGoals ?? []).map((g) => g.id);
    const incomingGoalIds = review.goals.map((g) => g.id);
    const goalsToDelete = existingGoalIds.filter((id) => !incomingGoalIds.includes(id));

    if (goalsToDelete.length) {
      await supabase.from("performance_goals").delete().in("id", goalsToDelete);
    }

    const goalUpserts = review.goals.map((g, i) => ({
      id: g.id,
      review_id: params.id,
      goal_text: g.goal_text,
      summary_text: g.summary_text,
      enhanced_summary: g.enhanced_summary ?? "",
      elements_demonstrated: g.elements_demonstrated ?? [],
      sort_order: i,
    }));

    const { error: goalsErr } = await supabase
      .from("performance_goals")
      .upsert(goalUpserts, { onConflict: "id" });

    if (goalsErr) {
      await logError({ source: "server", feature: "performance-review-put", message: goalsErr.message, context: { reviewId: params.id, stage: "upsert-goals" } });
      return NextResponse.json({ error: goalsErr.message }, { status: 500 });
    }

    // Same preserve-ID approach for tasks
    const { data: existingTasks } = await supabase
      .from("performance_goal_tasks")
      .select("id")
      .in("goal_id", incomingGoalIds);

    const existingTaskIds = (existingTasks ?? []).map((t) => t.id);
    const incomingTaskIds = review.goals.flatMap((g) => g.tasks.map((t) => t.id));
    const tasksToDelete = existingTaskIds.filter((id) => !incomingTaskIds.includes(id));

    if (tasksToDelete.length) {
      await supabase.from("performance_goal_tasks").delete().in("id", tasksToDelete);
    }

    const taskUpserts = review.goals.flatMap((g) =>
      g.tasks.map((t, ti) => ({
        id: t.id,
        goal_id: g.id,
        task_text: t.task_text,
        sort_order: ti,
      }))
    );

    if (taskUpserts.length) {
      const { error: tasksErr } = await supabase
        .from("performance_goal_tasks")
        .upsert(taskUpserts, { onConflict: "id" });
      if (tasksErr) {
        await logError({ source: "server", feature: "performance-review-put", message: tasksErr.message, context: { reviewId: params.id, stage: "upsert-tasks" } });
        return NextResponse.json({ error: tasksErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, updated_at: new Date().toISOString() });
  } catch (e) {
    await logError({ source: "server", feature: "performance-review-put", message: e.message, stack: e.stack, context: { reviewId: params?.id } });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

    const supabase = getSupabase();
    const { error } = await supabase
      .from("performance_reviews")
      .delete()
      .eq("id", params.id)
      .eq("user_id", userId);

    if (error) {
      await logError({ source: "server", feature: "performance-review-delete", message: error.message, context: { reviewId: params.id } });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    await logError({ source: "server", feature: "performance-review-delete", message: e.message, stack: e.stack, context: { reviewId: params?.id } });
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
