// Prompts and parsing for the resume "bullet coach". Presentation lives in
// components/resume/BulletCoach.jsx. The one hard rule: never invent facts. The model may only
// restructure what is already there, and when a bullet has no measurable result it asks the
// candidate for the real number instead of making one up.

export function bulletCoachPrompt(jobs) {
  return `You are an expert resume writer. Rewrite each resume bullet below using this formula:
Strong Action Verb + Context + Measurable Result

Rules:
- Start with a strong action verb. Use past tense, except for a job whose "current" value is true, where present tense is fine.
- Focus on what the candidate accomplished, not on duties.
- One concise sentence, no leading dash, no more than about 28 words.
- NEVER invent facts. Do not add any number, percentage, dollar amount, team size, timeframe, tool, or outcome that is not already stated in that bullet. Keep every figure that is already there. You may reorder and tighten the wording only.
- "hasResult" is true only if the original bullet already states a measurable or concrete outcome (a number, a before/after, a named deliverable that was completed).
- If "hasResult" is false, write one short, plain-language question in "question" that asks the candidate for the single real number or outcome that would make this bullet stronger (for example: "About how many people did you supervise?" or "Roughly how much time or money did this save?"). If no honest metric would make sense for this bullet, set "question" to null.

Jobs and bullets (job = job index, bullet = bullet index):
${JSON.stringify(jobs)}

Output STRICT, VALID JSON, nothing else: an array with one object per bullet, in the same order:
[{ "job": 0, "bullet": 0, "text": "rewritten bullet", "hasResult": true, "question": null }]
Escape internal double quotes and do not put line breaks inside strings. Return ONLY the JSON array.`;
}

export function bulletAnswerPrompt({ title, employer, bullet, question, answer }) {
  return `Rewrite this resume bullet using the candidate's answer.

Role: ${title || "unspecified"} at ${employer || "unspecified"}
Current bullet: ${bullet}
Question asked: ${question}
Candidate's answer: ${answer}

Rules:
- Formula: Strong Action Verb + Context + Measurable Result. One concise sentence, no leading dash, about 28 words at most.
- Use ONLY the figure or fact the candidate gave in their answer. Do not add any other number, outcome or detail. Do not make the answer sound bigger than it is.
- If the answer is empty or does not contain a usable fact, return the current bullet tightened, with nothing added.
Return only the rewritten bullet text. No quotes, no preamble.`;
}

export function parseBulletResults(text) {
  const cleaned = String(text || "").replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no array found");
  const arr = JSON.parse(cleaned.slice(start, end + 1));
  return arr
    .filter((r) => r && Number.isInteger(r.job) && Number.isInteger(r.bullet) && typeof r.text === "string" && r.text.trim())
    .map((r) => ({
      job: r.job,
      bullet: r.bullet,
      text: r.text.trim(),
      hasResult: r.hasResult === true,
      question: typeof r.question === "string" && r.question.trim() ? r.question.trim() : null,
    }));
}

// A rewrite must not introduce numbers that were not in the original (or in the candidate's
// answer). Cheap guard against the model quietly making a figure up.
export function introducesNewNumbers(original, rewritten, extra = "") {
  const nums = (s) => (String(s).match(/\d[\d,.]*%?/g) || []).map((n) => n.replace(/[,.]$/, ""));
  const allowed = new Set([...nums(original), ...nums(extra)]);
  return nums(rewritten).some((n) => !allowed.has(n));
}
