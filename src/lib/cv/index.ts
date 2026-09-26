import Anthropic from "@anthropic-ai/sdk";
import { parseCvWithClaude } from "./parse-claude";
import { parseCvHeuristically } from "./parse-heuristic";
import type { ImportDraftPayload } from "./types";

export { extractPdfText } from "./extract-text";
export * from "./types";

/**
 * Parse CV text into a structured draft. Uses Claude when an API key is
 * configured; otherwise (or on API failure) falls back to the local
 * heuristic so the feature always works — just with more manual review.
 */
export async function parseCv(
  cvText: string,
  hints: { name?: string } = {},
): Promise<ImportDraftPayload> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return { engine: "claude", cv: await parseCvWithClaude(cvText) };
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        console.error(`CV parse: Claude API error ${err.status} — falling back to heuristic`, err.message);
      } else {
        console.error("CV parse: unexpected error — falling back to heuristic", err);
      }
    }
  }
  return { engine: "heuristic", cv: parseCvHeuristically(cvText, hints) };
}
