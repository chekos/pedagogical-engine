/**
 * AI-generated creative tool labels.
 *
 * On server startup, calls Haiku to generate playful, education-themed
 * progress labels for all pedagogy tools. Falls back silently to
 * deterministic humanizers on the frontend if the API is unavailable.
 */

// All pedagogy tool names (without the mcp__pedagogy__ prefix)
const PEDAGOGY_TOOLS = [
  "load_roster",
  "query_skill_graph",
  "assess_learner",
  "generate_assessment_link",
  "check_assessment_status",
  "query_group",
  "audit_prerequisites",
  "compose_lesson_plan",
  "create_domain",
  "update_domain",
  "compose_curriculum",
  "advance_curriculum",
  "simulate_lesson",
  "analyze_tensions",
  "analyze_cross_domain_transfer",
  "explain_pedagogical_reasoning",
  "store_reasoning_traces",
  "analyze_meta_pedagogical_patterns",
  "analyze_assessment_integrity",
  "analyze_affective_context",
  "process_debrief",
  "query_teaching_wisdom",
  "analyze_teaching_patterns",
  "add_teaching_note",
  "load_educator_profile",
  "update_educator_profile",
  "analyze_educator_context",
  "report_assessment_progress",
];

const labelCache = new Map<string, string>();

/**
 * Generate creative labels via Haiku. Called once on server startup.
 * Fails silently — frontend has deterministic fallbacks.
 */
export async function warmToolLabels(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[tool-labels] No API key — skipping creative label generation");
    return;
  }

  try {
    const toolList = PEDAGOGY_TOOLS.map(t => `- ${t}`).join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `You are naming the loading states for a pedagogical reasoning engine — an AI that helps teachers plan lessons, assess students, and build skill graphs.

Generate a creative, warm, education-themed progress label for each tool below. Each label should be:
- 2-4 words in gerund/present-continuous form (e.g., "Taking attendance", "Mapping the territory")
- Playful and human — imagine a friendly teacher narrating what they're doing
- Evocative of the actual action (not random — a teacher reading it should smile AND understand what's happening)

Examples of the vibe:
- load_roster → "Taking attendance"
- query_skill_graph → "Mapping the learning landscape"
- compose_lesson_plan → "Crafting today's adventure"
- simulate_lesson → "Running a dress rehearsal"
- analyze_tensions → "Playing devil's advocate"

Return ONLY a JSON object mapping tool names to labels. No markdown, no explanation.

Tools:
${toolList}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log(`[tool-labels] Haiku API returned ${response.status} — using fallback labels`);
      return;
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text || "";

    // Extract JSON from response (Haiku might wrap in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[tool-labels] Could not parse JSON from Haiku response");
      return;
    }

    const labels = JSON.parse(jsonMatch[0]) as Record<string, string>;
    let count = 0;

    for (const [tool, label] of Object.entries(labels)) {
      if (typeof label === "string" && label.trim()) {
        // Store with the full MCP prefix so frontend can look up directly
        labelCache.set(`mcp__pedagogy__${tool}`, label.trim());
        count++;
      }
    }

    console.log(`[tool-labels] Generated ${count} creative labels via Haiku`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[tool-labels] Label generation failed (${msg}) — using fallback labels`);
  }
}

/** Get all cached creative labels as a plain object (for sending to frontend) */
export function getCreativeLabels(): Record<string, string> {
  return Object.fromEntries(labelCache);
}
