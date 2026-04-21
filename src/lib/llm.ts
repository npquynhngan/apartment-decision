import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { Apartment, Criterion, Score } from "@/types/database";

export const aiAnalysisSchema = z.object({
  summary: z
    .string()
    .min(1)
    .max(800)
    .describe("Two or three sentences summarizing the apartment's overall fit."),
  pros: z
    .array(z.string().min(1).max(240))
    .max(8)
    .describe("Short, concrete positive points grounded in the data provided."),
  cons: z
    .array(z.string().min(1).max(240))
    .max(8)
    .describe("Short, concrete concerns grounded in the data provided."),
  verify: z
    .array(z.string().min(1).max(240))
    .max(8)
    .describe(
      "Things the couple should verify during viewing or before signing a lease."
    ),
});

export type AiAnalysis = z.infer<typeof aiAnalysisSchema>;

export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const SYSTEM_PROMPT = `You help a couple in Singapore decide between rental apartments.

You will receive:
- Their shared criteria (with per-partner weights 0–10 and dealbreaker flags).
- A specific apartment (name, optional address, rent in SGD/month, size in square feet, listing URL, free-form notes).
- Current 1–5 partner scores for each criterion on that apartment. Scores may be marked (auto) when computed from straight-line distance.

Produce:
- summary: 2–3 honest sentences on whether this apartment is a strong fit.
- pros: concrete positives you can justify from the data. Do not invent facts.
- cons: concrete concerns from the data. Call out dealbreaker criteria scoring 1.
- verify: things they should confirm at the viewing or before signing (safety, noise, storage, lease terms, hidden costs, etc.) — phrased as short checkable items.

Rules:
- Be specific and practical. No generic filler.
- Currency is always SGD (display as "S$"). Size is square feet.
- If data is missing (no address, no rent), acknowledge it rather than guessing.
- Keep each pro/con/verify item under ~25 words.`;

function formatCriteria(criteria: Criterion[]): string {
  if (criteria.length === 0) return "(no criteria defined yet)";
  return criteria
    .map(
      (c) =>
        `- [${c.category}] ${c.name} — weight A=${c.weight_a}, B=${c.weight_b}${
          c.is_dealbreaker ? ", DEALBREAKER" : ""
        }${c.auto_source ? `, auto-scored from ${c.auto_source}` : ""}`
    )
    .join("\n");
}

function formatScores(criteria: Criterion[], scores: Score[]): string {
  if (criteria.length === 0) return "(no scores yet)";
  const byKey = new Map<string, Score>();
  for (const s of scores) byKey.set(`${s.criterion_id}:${s.user_slot}`, s);
  return criteria
    .map((c) => {
      const a = byKey.get(`${c.id}:a`);
      const b = byKey.get(`${c.id}:b`);
      const fmt = (s: Score | undefined) =>
        s ? `${s.value}${s.auto ? "(auto)" : ""}` : "—";
      return `- ${c.name}: A=${fmt(a)}, B=${fmt(b)}`;
    })
    .join("\n");
}

function formatApartment(apartment: Apartment): string {
  const lines: string[] = [`Name: ${apartment.name}`];
  if (apartment.address) lines.push(`Address: ${apartment.address}`);
  if (apartment.rent != null) lines.push(`Rent: S$${apartment.rent}/month`);
  if (apartment.sqft != null) lines.push(`Size: ${apartment.sqft} sqft`);
  if (apartment.url) lines.push(`Listing URL: ${apartment.url}`);
  if (apartment.notes) lines.push(`Notes: ${apartment.notes}`);
  return lines.join("\n");
}

export type AnalysisResult =
  | { data: AiAnalysis }
  | { error: string };

export async function generateApartmentAnalysis(
  apartment: Apartment,
  criteria: Criterion[],
  scores: Score[]
): Promise<AnalysisResult> {
  if (!isLlmEnabled()) {
    return { error: "Analysis is not configured on this server." };
  }

  const client = new Anthropic();

  const userContent = `Apartment:
${formatApartment(apartment)}

Current scores (1=worst, 5=best):
${formatScores(criteria, scores)}

Analyse this apartment. Return the structured JSON per the schema.`;

  try {
    const stream = client.messages.stream({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
        },
        {
          type: "text",
          text: `Shared criteria for this household:\n${formatCriteria(criteria)}`,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: zodOutputFormat(aiAnalysisSchema),
      },
    });

    const message = await stream.finalMessage();
    const parsed = message.parsed_output;
    if (!parsed) {
      return { error: "Model did not return a parseable analysis." };
    }
    return { data: parsed };
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return { error: "Rate limited by Claude API — try again in a minute." };
    }
    if (err instanceof Anthropic.APIError) {
      return { error: `Claude API error: ${err.message}` };
    }
    return {
      error: err instanceof Error ? err.message : "Unknown analysis error",
    };
  }
}
