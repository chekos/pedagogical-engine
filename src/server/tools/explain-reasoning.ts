import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, loadGraph } from "./shared.js";

/**
 * Meta-pedagogical reasoning tool: explains the pedagogical reasoning
 * behind any decision in a lesson plan.
 *
 * The educator asks "why?" about a section, pairing, timing, activity,
 * or ordering decision, and this tool retrieves the reasoning trace
 * (if stored) or constructs one from the available evidence.
 */
export const explainReasoningTool = tool(
  "explain_pedagogical_reasoning",
  "Explain the pedagogical reasoning behind a specific decision in a lesson plan. Given a lesson ID and a question about a decision (ordering, timing, pairing, activity choice, etc.), retrieves stored reasoning traces and the evidence that drove the decision — specific learner profiles, dependency chains, Bloom's levels, constraints, and alternatives considered. Returns structured evidence for the agent to compose a natural-language explanation.",
  {
    lessonId: z
      .string()
      .describe("The lesson plan filename (without .md extension)"),
    question: z
      .string()
      .describe(
        "The educator's question about the plan, e.g. 'Why did you put hands-on before theory?' or 'Why 15 minutes for this section?'"
      ),
    sectionId: z
      .string()
      .optional()
      .describe(
        "Optional: specific section reference (e.g. 'phase-2', 'activity-1', a time range like '0:15-0:27')"
      ),
    decisionType: z
      .enum([
        "ordering",
        "timing",
        "pairing",
        "activity_choice",
        "content_depth",
        "contingency",
        "general",
      ])
      .optional()
      .describe("The type of decision being questioned"),
  },
  async ({ lessonId, question, sectionId, decisionType }) => {
    // 1. Load the lesson plan
    const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
    let lessonContent: string;
    try {
      lessonContent = await fs.readFile(lessonPath, "utf-8");
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Lesson '${lessonId}' not found`,
              suggestion:
                "Check the lesson ID. Use the /api/lessons endpoint to list available lessons.",
            }),
          },
        ],
      };
    }

    // 2. Load stored reasoning traces (if they exist)
    const tracesPath = path.join(
      DATA_DIR,
      "reasoning-traces",
      `${lessonId}.json`
    );
    let traces: ReasoningTrace[] = [];
    try {
      const raw = await fs.readFile(tracesPath, "utf-8");
      const data = JSON.parse(raw);
      traces = data.traces || [];
    } catch {
      // No stored traces — we'll construct evidence from the lesson plan itself
    }

    // 3. Parse lesson metadata
    const domainMatch = lessonContent.match(
      /\*\*Domain:\*\*\s*(.+)|Domain\*\*\s*\|\s*(.+)\s*\|/
    );
    const domain =
      domainMatch?.[1]?.trim() || domainMatch?.[2]?.trim() || "";

    const groupMatch = lessonContent.match(
      /\*\*Group:\*\*\s*(.+)|Prepared for:\*\*\s*(.+)/
    );
    const durationMatch = lessonContent.match(
      /\*\*Duration\*\*\s*\|\s*(.+)\s*\|/
    );

    // 4. Load skill graph if domain is available
    let graphInfo: {
      skillCount: number;
      edgeCount: number;
      bloomDistribution: Record<string, number>;
    } | null = null;
    let dependencyChains: Array<{
      from: string;
      to: string;
      chain: string[];
    }> = [];

    if (domain) {
      try {
        const graph = await loadGraph(domain);
        const bloomDist: Record<string, number> = {};
        for (const s of graph.skills) {
          bloomDist[s.bloom_level] = (bloomDist[s.bloom_level] || 0) + 1;
        }
        graphInfo = {
          skillCount: graph.skills.length,
          edgeCount: graph.edges.length,
          bloomDistribution: bloomDist,
        };

        // Extract dependency chains for skills mentioned in lesson
        const skillIds = graph.skills.map((s) => s.id);
        const edgeMap = new Map<string, string[]>();
        for (const e of graph.edges) {
          if (!edgeMap.has(e.target)) edgeMap.set(e.target, []);
          edgeMap.get(e.target)!.push(e.source);
        }

        // Find skills mentioned in the lesson
        const mentionedSkills = skillIds.filter(
          (id) =>
            lessonContent.includes(id) ||
            lessonContent
              .toLowerCase()
              .includes(id.replace(/-/g, " "))
        );

        // Build dependency chains for mentioned skills
        for (const skillId of mentionedSkills.slice(0, 10)) {
          const prereqs = edgeMap.get(skillId) || [];
          for (const prereq of prereqs) {
            if (mentionedSkills.includes(prereq)) {
              dependencyChains.push({
                from: prereq,
                to: skillId,
                chain: [prereq, skillId],
              });
            }
          }
        }
      } catch {
        // Domain graph not available
      }
    }

    // 5. Extract learner profile references from the lesson
    const learnerMentions: Array<{
      name: string;
      context: string;
    }> = [];
    const learnerRegex =
      /\*\*([A-Z][a-z]+ [A-Z][a-z]+)\*\*\s*[-–—]\s*(.+?)(?:\n|$)/g;
    let match;
    while ((match = learnerRegex.exec(lessonContent)) !== null) {
      learnerMentions.push({
        name: match[1],
        context: match[2].trim(),
      });
    }

    // 6. Extract timing information
    const timingBeats: Array<{
      range: string;
      title: string;
      duration: string;
    }> = [];
    const timingRegex =
      /\*\*\[(\d+:\d+[-–]\d+:\d+)\]\s*(.+?)\s*\((\d+\s*min)\)\*\*/g;
    while ((match = timingRegex.exec(lessonContent)) !== null) {
      timingBeats.push({
        range: match[1],
        title: match[2].trim(),
        duration: match[3],
      });
    }

    // 7. Find matching stored traces for the question
    const matchingTraces = traces.filter((t) => {
      if (sectionId && t.sectionId && t.sectionId !== sectionId)
        return false;
      if (decisionType && t.decisionType !== decisionType) return false;
      // Fuzzy match on question keywords
      const qWords = question.toLowerCase().split(/\s+/);
      const tWords = (t.decision + " " + t.reasoning).toLowerCase();
      const matchCount = qWords.filter(
        (w) => w.length > 3 && tWords.includes(w)
      ).length;
      return matchCount >= 2 || (!sectionId && !decisionType);
    });

    // 8. Extract contingencies and alternatives from the plan
    const contingencies: string[] = [];
    const contingencyRegex = /###\s*If\s+(.+?)(?=\n###|\n---|\n$)/gs;
    while (
      (match = contingencyRegex.exec(lessonContent)) !== null
    ) {
      contingencies.push(match[1].split("\n")[0].trim());
    }

    // 9. Check for teaching wisdom references
    const wisdomReferences: string[] = [];
    const wisdomRegex =
      /[Bb]ased on .+?(?:sessions?|experience|wisdom|patterns?).*?[.!]/g;
    while ((match = wisdomRegex.exec(lessonContent)) !== null) {
      wisdomReferences.push(match[0]);
    }

    // 10. Check for educator profile references
    const educatorReferences: string[] = [];
    const educatorRegex =
      /(?:teaching style|educator profile|preferred styles?|timing patterns?).*?[.!]/gi;
    while ((match = educatorRegex.exec(lessonContent)) !== null) {
      educatorReferences.push(match[0]);
    }

    // 11. Load teaching wisdom for context
    let wisdomContext: {
      sessionCount: number;
      relevantNotes: Array<{ type: string; observation: string; confidence: number }>;
    } | null = null;

    if (domain) {
      try {
        const wisdomPath = path.join(
          DATA_DIR,
          "domains",
          domain,
          "teaching-notes.json"
        );
        const raw = await fs.readFile(wisdomPath, "utf-8");
        const wisdomData = JSON.parse(raw);
        wisdomContext = {
          sessionCount: wisdomData.sessionCount || 0,
          relevantNotes: (wisdomData.notes || [])
            .filter(
              (n: { confidence: number }) => n.confidence >= 0.7
            )
            .slice(0, 5)
            .map(
              (n: {
                type: string;
                observation: string;
                confidence: number;
              }) => ({
                type: n.type,
                observation: n.observation,
                confidence: n.confidence,
              })
            ),
        };
      } catch {
        // No wisdom data
      }
    }

    const result = {
      lessonId,
      question,
      sectionId: sectionId || null,
      decisionType: decisionType || "general",
      lessonMeta: {
        domain,
        group: groupMatch?.[1]?.trim() || groupMatch?.[2]?.trim() || null,
        duration: durationMatch?.[1]?.trim() || null,
      },
      storedTraces: matchingTraces,
      evidence: {
        graphInfo,
        dependencyChains,
        learnerProfiles: learnerMentions,
        timingBeats,
        contingencies,
        wisdomReferences,
        educatorReferences,
        wisdomContext,
      },
      guidance:
        "Use this evidence to compose a natural, conversational explanation. " +
        "Reference specific learner profiles by name, cite dependency chains, " +
        "name Bloom's taxonomy levels, and mention alternatives considered. " +
        "The explanation should feel like a conversation with a thoughtful colleague — " +
        "specific, grounded, not defensive. If the educator disagrees, defer: " +
        "'I've shared my reasoning. You know your students better than I do.'",
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

/**
 * Tool to store reasoning traces alongside a lesson plan.
 * Called during lesson composition to capture the "why" behind each decision.
 */
export const storeReasoningTracesTool = tool(
  "store_reasoning_traces",
  "Store structured reasoning traces for a lesson plan. Called during or after lesson composition to capture the pedagogical reasoning behind each major decision. These traces power the 'why' explanations when educators ask about the plan.",
  {
    lessonId: z
      .string()
      .describe("The lesson plan filename (without .md extension)"),
    domain: z.string().describe("The skill domain"),
    groupName: z.string().describe("The group the lesson was composed for"),
    traces: z
      .array(
        z.object({
          id: z.string().describe("Unique trace ID"),
          sectionId: z
            .string()
            .optional()
            .describe("Which section this trace applies to"),
          decisionType: z
            .enum([
              "ordering",
              "timing",
              "pairing",
              "activity_choice",
              "content_depth",
              "contingency",
            ])
            .describe("What type of decision this trace explains"),
          decision: z
            .string()
            .describe(
              "What was decided, e.g. 'Hands-on exercise placed before theory explanation'"
            ),
          reasoning: z
            .string()
            .describe(
              "Why this decision was made — the pedagogical reasoning"
            ),
          evidence: z
            .object({
              skillGraph: z
                .array(z.string())
                .optional()
                .describe("Skill IDs or dependency chains referenced"),
              learnerProfiles: z
                .array(z.string())
                .optional()
                .describe("Learner names/IDs whose profiles influenced this"),
              bloomsLevels: z
                .array(z.string())
                .optional()
                .describe("Bloom's taxonomy levels referenced"),
              constraints: z
                .array(z.string())
                .optional()
                .describe("Constraints that shaped this decision"),
              teachingWisdom: z
                .array(z.string())
                .optional()
                .describe("Teaching wisdom notes that influenced this"),
              educatorProfile: z
                .array(z.string())
                .optional()
                .describe("Educator profile factors that influenced this"),
            })
            .describe("The specific evidence that drove this decision"),
          alternativesConsidered: z
            .array(
              z.object({
                option: z
                  .string()
                  .describe("What alternative was considered"),
                whyRejected: z
                  .string()
                  .describe("Why it was not chosen"),
              })
            )
            .optional()
            .describe("Other options that were considered and why they were rejected"),
          wouldChangIf: z
            .string()
            .optional()
            .describe(
              "What would need to change for this decision to go differently"
            ),
        })
      )
      .describe("Array of reasoning traces to store"),
  },
  async ({ lessonId, domain, groupName, traces }) => {
    const tracesDir = path.join(DATA_DIR, "reasoning-traces");
    await fs.mkdir(tracesDir, { recursive: true });

    const filePath = path.join(tracesDir, `${lessonId}.json`);
    const data = {
      lessonId,
      domain,
      groupName,
      createdAt: new Date().toISOString(),
      traceCount: traces.length,
      traces,
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");

    // Also count by decision type for summary
    const typeCounts: Record<string, number> = {};
    for (const t of traces) {
      typeCounts[t.decisionType] =
        (typeCounts[t.decisionType] || 0) + 1;
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            stored: true,
            lessonId,
            file: filePath,
            traceCount: traces.length,
            decisionTypes: typeCounts,
            message: `Stored ${traces.length} reasoning traces for lesson ${lessonId}. Educators can now ask "why" about any decision in this plan.`,
          }),
        },
      ],
    };
  }
);

// Types for reasoning traces
interface ReasoningTrace {
  id: string;
  sectionId?: string;
  decisionType: string;
  decision: string;
  reasoning: string;
  evidence: {
    skillGraph?: string[];
    learnerProfiles?: string[];
    bloomsLevels?: string[];
    constraints?: string[];
    teachingWisdom?: string[];
    educatorProfile?: string[];
  };
  alternativesConsidered?: Array<{
    option: string;
    whyRejected: string;
  }>;
  wouldChangeIf?: string;
}
