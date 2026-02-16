/**
 * Dynamic content translation via Haiku with filesystem cache.
 *
 * Translates skill labels, notes, and assessment summaries at request time.
 * Cache is permanent — content rarely changes.
 */

import { createHash } from "crypto";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "agent-workspace", "data");
const CACHE_DIR = path.join(DATA_DIR, "translations");

/** SHA-256 hash truncated to 16 hex chars, used as cache key. */
function cacheKey(text: string, lang: string): string {
  return createHash("sha256").update(`${text}\0${lang}`).digest("hex").slice(0, 16);
}

/** Read a cached translation, or return undefined. */
async function readCache(text: string, lang: string): Promise<string | undefined> {
  const dir = path.join(CACHE_DIR, lang);
  const file = path.join(dir, `${cacheKey(text, lang)}.json`);
  try {
    const raw = await readFile(file, "utf-8");
    const entry = JSON.parse(raw);
    return typeof entry.translation === "string" ? entry.translation : undefined;
  } catch {
    return undefined;
  }
}

/** Write a translation to cache. */
async function writeCache(text: string, lang: string, translation: string): Promise<void> {
  const dir = path.join(CACHE_DIR, lang);
  try {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${cacheKey(text, lang)}.json`);
    await writeFile(
      file,
      JSON.stringify({ source: text, translation, cachedAt: new Date().toISOString() }),
      "utf-8"
    );
  } catch {
    // Non-fatal — just skip caching
  }
}

/**
 * Translate a batch of strings to the target language using Haiku.
 * Returns a Map of original -> translated. Falls back to originals on failure.
 */
export async function translateBatch(
  strings: string[],
  targetLang: string,
  context: string
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (strings.length === 0) return result;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // No API key — return originals
    for (const s of strings) result.set(s, s);
    return result;
  }

  // Check cache first
  const uncached: string[] = [];
  for (const s of strings) {
    const cached = await readCache(s, targetLang);
    if (cached !== undefined) {
      result.set(s, cached);
    } else {
      uncached.push(s);
    }
  }

  if (uncached.length === 0) return result;

  // Language display names for the prompt
  const langNames: Record<string, string> = {
    es: "Spanish",
    fr: "French",
    zh: "Simplified Chinese",
    ar: "Arabic",
    pt: "Brazilian Portuguese",
  };
  const langName = langNames[targetLang] || targetLang;

  try {
    const numbered = uncached.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `Translate the following ${context} strings from English to ${langName}.

Rules:
- Preserve person names exactly (e.g., "Priya", "Marcus", "Sofia")
- Preserve technical terms: Python, pandas, matplotlib, NumPy, R, SQL, etc.
- Use standard Bloom's taxonomy translations for the target language
- Keep the same tone and register as the original
- Return ONLY a JSON array of translated strings in the same order

Strings to translate:
${numbered}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log(`[translate] Haiku API returned ${response.status} — falling back to English`);
      for (const s of uncached) result.set(s, s);
      return result;
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("[translate] Could not parse JSON array from Haiku response");
      for (const s of uncached) result.set(s, s);
      return result;
    }

    const translated = JSON.parse(jsonMatch[0]) as string[];

    for (let i = 0; i < uncached.length; i++) {
      const original = uncached[i];
      const tr = typeof translated[i] === "string" ? translated[i] : original;
      result.set(original, tr);
      // Cache in background — don't await
      writeCache(original, targetLang, tr);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[translate] Translation failed (${msg}) — falling back to English`);
    for (const s of uncached) result.set(s, s);
  }

  return result;
}

/**
 * Translate all dynamic content in a portal response object in-place.
 * Collects skill labels, note content, and assessment strings, batches them
 * into one Haiku call, and replaces values with translations.
 */
export async function translatePortalData(
  data: Record<string, unknown>,
  lang: string
): Promise<void> {
  const strings: string[] = [];

  // Collect skill labels
  const skillLabels = data.skillLabels as Record<string, string> | undefined;
  if (skillLabels) {
    for (const val of Object.values(skillLabels)) {
      if (val && !strings.includes(val)) strings.push(val);
    }
  }

  // Collect note content
  const notes = data.notes as Array<{ content: string }> | undefined;
  if (notes) {
    for (const note of notes) {
      if (note.content && !strings.includes(note.content)) strings.push(note.content);
    }
  }

  // Collect assessment summaries and descriptions
  const assessments = data.assessments as {
    completed?: Array<{ summary?: string; description?: string }>;
    pending?: Array<{ summary?: string; description?: string }>;
  } | undefined;
  if (assessments) {
    for (const list of [assessments.completed, assessments.pending]) {
      if (!list) continue;
      for (const a of list) {
        if (a.summary && !strings.includes(a.summary)) strings.push(a.summary);
        if (a.description && !strings.includes(a.description)) strings.push(a.description);
      }
    }
  }

  // Collect next step labels from progressData
  const progressData = data.progressData as {
    nextSteps?: Array<{ label: string }>;
  } | undefined;
  if (progressData?.nextSteps) {
    for (const step of progressData.nextSteps) {
      if (step.label && !strings.includes(step.label)) strings.push(step.label);
    }
  }

  // Collect next step labels from skillMap
  const skillMap = data.skillMap as {
    next?: Array<{ label: string }>;
  } | undefined;
  if (skillMap?.next) {
    for (const step of skillMap.next) {
      if (step.label && !strings.includes(step.label)) strings.push(step.label);
    }
  }

  if (strings.length === 0) return;

  const translations = await translateBatch(strings, lang, "educational skill and assessment");

  // Replace in-place
  if (skillLabels) {
    for (const key of Object.keys(skillLabels)) {
      const tr = translations.get(skillLabels[key]);
      if (tr) skillLabels[key] = tr;
    }
  }

  if (notes) {
    for (const note of notes) {
      const tr = translations.get(note.content);
      if (tr) note.content = tr;
    }
  }

  if (assessments) {
    for (const list of [assessments.completed, assessments.pending]) {
      if (!list) continue;
      for (const a of list) {
        if (a.summary) {
          const tr = translations.get(a.summary);
          if (tr) a.summary = tr;
        }
        if (a.description) {
          const tr = translations.get(a.description);
          if (tr) a.description = tr;
        }
      }
    }
  }

  if (progressData?.nextSteps) {
    for (const step of progressData.nextSteps) {
      const tr = translations.get(step.label);
      if (tr) step.label = tr;
    }
  }

  if (skillMap?.next) {
    for (const step of skillMap.next) {
      const tr = translations.get(step.label);
      if (tr) step.label = tr;
    }
  }
}
