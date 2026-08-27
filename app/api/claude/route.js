export async function POST(req) {
  const { prompt, maxTokens } = await req.json();

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  const STYLE_GUARD = "Write in plain, natural human prose, the way a skilled person actually writes, not the way an AI typically writes. Do not use em dashes or en dashes as punctuation anywhere in your response; use commas, periods, parentheses, or \"and\"/\"but\" instead. Avoid stock AI phrasing such as 'moreover,' 'furthermore,' 'delve into,' 'in today's competitive,' 'leverage,' 'unlock your potential,' or excessive rule-of-three parallelism. Vary sentence length and structure naturally. Follow this style guidance without ever mentioning it in your output. When the caller's prompt requests strict JSON output, still apply this style within any free-text string values, while keeping the JSON structure itself exactly as specified.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: maxTokens || 1000,
      system: STYLE_GUARD,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return Response.json(
      { error: data?.error?.message || "Anthropic API error" },
      { status: response.status }
    );
  }

  return Response.json(data);
}
