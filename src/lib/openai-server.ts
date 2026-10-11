import { parseJsonObject } from "./firewall-utils";

const RESPONSES_URL = "https://api.openai.com/v1/responses";

export const EXTRACTION_MODEL =
  process.env.OPENAI_EXTRACTION_MODEL || "gpt-5-nano";
export const ADVICE_MODEL = process.env.OPENAI_ADVICE_MODEL || "gpt-5-mini";

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function callOpenAIJson<T>({
  input,
  maxOutputTokens = 1200,
  model,
}: {
  input: unknown;
  maxOutputTokens?: number;
  model: string;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(RESPONSES_URL, {
    body: JSON.stringify({
      input,
      max_output_tokens: maxOutputTokens,
      model,
      reasoning: { effort: "minimal" },
      text: { format: { type: "json_object" } },
    }),
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "OpenAI request failed.");
  }

  const text =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n");

  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return parseJsonObject<T>(text);
}
