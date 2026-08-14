export const REVIEW_PERIOD_LABELS = {
  mid_year: "Mid-Year",
  end_of_year: "End of Year",
  end_of_position: "End of Position",
};

// Shared between the client (labels) and both AI enhance routes (framing
// instructions), so mid-year/end-of-year/end-of-position mean something
// different and consistent everywhere, not just a label on a button.
export const PERIOD_FRAMING = {
  mid_year:
    "This is a MID-YEAR review, not a year-end wrap-up. Frame the narrative around where things stand right now toward this goal — progress made so far this year — and what is planned between now and year-end to fully meet or exceed it. Do not write as though the year is already over or as a final summary.",
  end_of_year:
    "This is an END-OF-YEAR review. Frame the narrative as a wrap-up of the full year's performance on this goal — what was accomplished across the year, start to finish.",
  end_of_position:
    "This is an END-OF-POSITION review, marking the employee's departure from this role. Frame the narrative as a final wrap-up of everything accomplished on this goal during their time in the position, with a sense of closure appropriate to someone moving on.",
};

export const ELEMENT_LABELS = {
  surpassed_outcomes: "Surpassed most outcomes/targets",
  unique_contribution: "Special or unique contribution",
  extraordinary_effort: "Extraordinary effort",
};

export function emptyTask(sort_order) {
  return { id: crypto.randomUUID(), task_text: "", sort_order };
}

export function emptyGoal(sort_order) {
  return {
    id: crypto.randomUUID(),
    goal_text: "",
    summary_text: "",
    enhanced_summary: "",
    elements_demonstrated: [],
    sort_order,
    tasks: [emptyTask(0)],
  };
}
