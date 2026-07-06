import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { parsedCvSchema, type ParsedCv } from "./types";

const SYSTEM = `You extract structured profile data from CV/resume text for a talent marketplace.

Rules:
- Extract only what the text actually says — never invent or embellish.
- headline: a one-line professional title (e.g. "Fullstack Developer — React & Node.js"). Compose from the CV's own words.
- bio: the summary/profile section if present, lightly cleaned up; null if none.
- skills: concrete skills/technologies/tools, deduplicated, max 20.
- experiences: most recent first. isCurrent=true when the role is ongoing ("present", "nuvarande", no end date).
- Dates: extract years (and months 1-12 when stated). Unknown = null.
- educations: degree is the level (e.g. "MSc", "BSc", "Civilingenjör"), field is the subject.
- Deliberately IGNORE: photos, age, date of birth, gender, marital status, nationality and other protected attributes — even if the CV includes them. Also ignore references and their contact details.
- The CV may be in Swedish or English; output field values in the CV's own language.`;

/**
 * Structure CV text with Claude using structured outputs — the response is
 * guaranteed to match parsedCvSchema. Per Anthropic's API terms, API data is
 * not used for model training (documented in our privacy policy).
 */
export async function parseCvWithClaude(cvText: string): Promise<ParsedCv> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY

  const response = await client.messages.parse({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Extract the profile data from this CV:\n\n<cv>\n${cvText.slice(0, 60_000)}\n</cv>`,
      },
    ],
    output_config: { format: zodOutputFormat(parsedCvSchema) },
  });

  if (!response.parsed_output) {
    throw new Error(`CV parse returned no structured output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
