"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { emptyGoal, emptyTask, ELEMENT_LABELS } from "@/lib/performance-review-shared.js";
import { TOKENS } from "@/lib/design-tokens.js";

const MIN_GOALS = 3;
const ELEMENT_KEYS = ["surpassed_outcomes", "unique_contribution", "extraordinary_effort"];

const inputStyle = {
  width: "100%",
  fontSize: 16,
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${TOKENS.line}`,
  color: TOKENS.ink,
  boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 600,
  color: TOKENS.inkSoft,
  display: "block",
  marginBottom: 6,
};

function GoalEnhanceBlock({ reviewId, userId, goal, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enhance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/performance-review/${reviewId}/goal-enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, goalId: goal.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      onUpdate({ enhanced_summary: data.narrative, elements_demonstrated: data.elements_demonstrated });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const meetsBar = goal.elements_demonstrated.length >= 2;

  return (
    <div style={{ marginTop: 16 }}>
      <button
        type="button"
        onClick={enhance}
        disabled={loading || !goal.goal_text}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: TOKENS.accent, color: "#fff", border: "none",
          borderRadius: 10, padding: "10px 16px", fontSize: 14, fontWeight: 600,
          cursor: loading || !goal.goal_text ? "default" : "pointer",
          opacity: loading || !goal.goal_text ? 0.55 : 1,
        }}
      >
        <Sparkles size={15} />
        {loading ? "Enhancing..." : "Enhance this goal with AI"}
      </button>
      {!goal.goal_text && (
        <p style={{ fontSize: 13, color: TOKENS.gold, marginTop: 8 }}>Fill in the goal text above first.</p>
      )}
      {error && <p style={{ fontSize: 13, color: TOKENS.red, marginTop: 8 }}>{error}</p>}

      {goal.enhanced_summary && (
        <div style={{ marginTop: 12, background: TOKENS.paper, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {ELEMENT_KEYS.map((el) => {
              const hit = goal.elements_demonstrated.includes(el);
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
            <p style={{ fontSize: 13, color: TOKENS.gold, marginBottom: 10 }}>
              Only {goal.elements_demonstrated.length} of 2 required elements were clearly supported.
              Add more detail to the summary above and re-enhance.
            </p>
          )}
          <textarea
            value={goal.enhanced_summary}
            onChange={(e) => onUpdate({ enhanced_summary: e.target.value })}
            rows={6}
            style={{ ...inputStyle, background: TOKENS.surface, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>
      )}
    </div>
  );
}

export function GoalsBuilder({ goals, onChange, reviewId, userId }) {
  const updateGoal = (id, patch) => {
    onChange(goals.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const addGoal = () => onChange([...goals, emptyGoal(goals.length)]);

  const removeGoal = (id) => {
    if (goals.length <= MIN_GOALS) return;
    onChange(goals.filter((g) => g.id !== id));
  };

  const addTask = (goalId) => {
    onChange(
      goals.map((g) =>
        g.id === goalId ? { ...g, tasks: [...g.tasks, emptyTask(g.tasks.length)] } : g
      )
    );
  };

  const updateTask = (goalId, taskId, task_text) => {
    onChange(
      goals.map((g) =>
        g.id === goalId
          ? { ...g, tasks: g.tasks.map((t) => (t.id === taskId ? { ...t, task_text } : t)) }
          : g
      )
    );
  };

  const removeTask = (goalId, taskId) => {
    onChange(
      goals.map((g) => {
        if (g.id !== goalId) return g;
        if (g.tasks.length <= 1) return g;
        return { ...g, tasks: g.tasks.filter((t) => t.id !== taskId) };
      })
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {goals.map((goal, gi) => (
        <div
          key={goal.id}
          style={{ background: TOKENS.surface, borderRadius: 16, padding: 24, boxShadow: TOKENS.shadow }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Goal {gi + 1}</label>
              <input
                type="text"
                value={goal.goal_text}
                onChange={(e) => updateGoal(goal.id, { goal_text: e.target.value })}
                placeholder="e.g. Improve regional delivery performance metrics"
                style={inputStyle}
              />
            </div>
            {goals.length > MIN_GOALS && (
              <button
                type="button"
                onClick={() => removeGoal(goal.id)}
                style={{ marginTop: 30, background: "none", border: "none", color: "#9AA3A0", fontSize: 13, cursor: "pointer" }}
              >
                Remove
              </button>
            )}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ ...labelStyle, fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Tasks / Targets
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
              {goal.tasks.map((task) => (
                <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="text"
                    value={task.task_text}
                    onChange={(e) => updateTask(goal.id, task.id, e.target.value)}
                    placeholder="e.g. Reduced late scans by 15% in Q2"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {goal.tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(goal.id, task.id)}
                      aria-label="Remove task"
                      style={{ background: "none", border: "none", color: "#9AA3A0", cursor: "pointer", padding: 4 }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addTask(goal.id)}
              style={{ background: "none", border: "none", color: TOKENS.accent, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              + Add another task
            </button>
          </div>

          <label style={labelStyle}>Summary for this goal</label>
          <textarea
            value={goal.summary_text}
            onChange={(e) => updateGoal(goal.id, { summary_text: e.target.value })}
            rows={4}
            placeholder="Briefly summarize your performance against this goal..."
            style={{ ...inputStyle, lineHeight: 1.5, resize: "vertical" }}
          />

          <GoalEnhanceBlock
            reviewId={reviewId}
            userId={userId}
            goal={goal}
            onUpdate={(patch) => updateGoal(goal.id, patch)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addGoal}
        style={{
          width: "100%",
          background: "none",
          border: `2px dashed ${TOKENS.line}`,
          borderRadius: 16,
          padding: "16px",
          fontSize: 14,
          fontWeight: 600,
          color: TOKENS.inkSoft,
          cursor: "pointer",
        }}
      >
        + Add another goal
      </button>
    </div>
  );
}
