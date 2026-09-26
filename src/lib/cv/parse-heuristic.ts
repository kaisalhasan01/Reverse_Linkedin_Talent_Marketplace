import { emptyParsedCv, type ParsedCv } from "./types";

/**
 * Local, zero-dependency CV parser used when no ANTHROPIC_API_KEY is set
 * (or the API call fails). Section-based heuristics — deliberately modest:
 * the review step lets the candidate fix anything it gets wrong.
 */

const SECTION_PATTERNS: Record<string, RegExp> = {
  experience: /^(work\s+)?(experience|employment( history)?|arbetslivserfarenhet|erfarenhet|anställningar)\b/i,
  education: /^(education|utbildning(ar)?)\b/i,
  skills: /^(skills|technical skills|kompetenser|färdigheter|teknisk kompetens)\b/i,
  certifications: /^(certifications?|certifikat|certifieringar|licenser)\b/i,
  summary: /^(summary|profile|about( me)?|profil|sammanfattning|om mig)\b/i,
};

const YEAR_RANGE = /(\d{4})\s*[-–—]\s*(\d{4}|present|now|current|ongoing|nuvarande|pågående|idag)/i;
const DEGREE = /\b(MSc|M\.Sc|BSc|B\.Sc|PhD|MBA|Master|Bachelor|Civilingenjör|Högskoleingenjör|Kandidat|Magister)\b/i;

function sectionOf(line: string): string | null {
  const trimmed = line.trim().replace(/[:\s]+$/, "");
  if (trimmed.length > 40) return null; // headers are short
  for (const [name, pattern] of Object.entries(SECTION_PATTERNS)) {
    if (pattern.test(trimmed)) return name;
  }
  return null;
}

export function parseCvHeuristically(text: string): ParsedCv {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const result: ParsedCv = structuredClone(emptyParsedCv);

  // Bucket lines by section
  let current = "header";
  const buckets = new Map<string, string[]>([["header", []]]);
  for (const line of lines) {
    const section = sectionOf(line);
    if (section) {
      current = section;
      if (!buckets.has(current)) buckets.set(current, []);
      continue;
    }
    const bucket = buckets.get(current);
    if (bucket) bucket.push(line);
    else buckets.set(current, [line]);
  }

  // Headline: first short header line that isn't contact info
  for (const line of (buckets.get("header") ?? []).slice(0, 6)) {
    if (!line || line.length > 90) continue;
    if (/[@\d]{4,}|https?:|linkedin|github/i.test(line)) continue;
    if (result.headline === null) result.headline = line;
    else break;
  }

  // Bio from summary section
  const summary = (buckets.get("summary") ?? []).filter(Boolean).join(" ").trim();
  if (summary) result.bio = summary.slice(0, 2000);

  // Skills: split on commas, bullets and pipes
  const skillText = (buckets.get("skills") ?? []).join(",");
  result.skills = [
    ...new Set(
      skillText
        .split(/[,•·|;\n]/)
        .map((s) => s.trim().replace(/^-\s*/, ""))
        .filter((s) => s && s.length <= 40),
    ),
  ].slice(0, 20);

  // Experiences: lines containing a year range start a new entry
  const expLines = buckets.get("experience") ?? [];
  for (let i = 0; i < expLines.length; i++) {
    const match = expLines[i].match(YEAR_RANGE);
    if (!match) continue;
    const isCurrent = !/^\d{4}$/.test(match[2]);
    // Title/company usually live on the same line or the one above
    const context = expLines[i].replace(YEAR_RANGE, "").trim() || expLines[i - 1] || "";
    const [titlePart, companyPart] = context.split(/\s+(?:at|@|hos|på)\s+|\s*[,|–—]\s*/);
    result.experiences.push({
      title: (titlePart ?? "Role").trim().slice(0, 100) || "Role",
      company: (companyPart ?? "").trim().slice(0, 100) || "Unknown",
      startYear: Number(match[1]),
      startMonth: null,
      endYear: isCurrent ? null : Number(match[2]),
      endMonth: null,
      isCurrent,
      description: (expLines[i + 1] && !expLines[i + 1].match(YEAR_RANGE) ? expLines[i + 1] : "").slice(0, 500) || null,
    });
  }

  // Educations: degree keyword and/or year range
  const eduLines = buckets.get("education") ?? [];
  for (let i = 0; i < eduLines.length; i++) {
    const degreeMatch = eduLines[i].match(DEGREE);
    if (!degreeMatch) continue;
    const range = eduLines[i].match(YEAR_RANGE) ?? eduLines[i + 1]?.match(YEAR_RANGE);
    const rest = eduLines[i].replace(DEGREE, "").replace(YEAR_RANGE, "");
    const parts = rest.split(/\s*[,|–—]\s*|\s+(?:in|i|at|vid)\s+/).map((p) => p.trim()).filter(Boolean);
    result.educations.push({
      school: parts[1] ?? parts[0] ?? "Unknown",
      degree: degreeMatch[0],
      field: parts[0] ?? "",
      startYear: range ? Number(range[1]) : null,
      endYear: range && /^\d{4}$/.test(range[2]) ? Number(range[2]) : null,
    });
  }

  // Certifications: one per non-empty line
  for (const line of buckets.get("certifications") ?? []) {
    if (!line) continue;
    const year = line.match(/\b(19|20)\d{2}\b/);
    const [name, issuer] = line.split(/\s*[,|–—]\s*/);
    result.certifications.push({
      name: name.replace(/\b(19|20)\d{2}\b/, "").trim().slice(0, 120) || line.slice(0, 120),
      issuer: issuer?.replace(/\b(19|20)\d{2}\b/, "").trim().slice(0, 120) || null,
      year: year ? Number(year[0]) : null,
    });
  }

  return result;
}
