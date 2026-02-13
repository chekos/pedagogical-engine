import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, toolResponse, TeachingNote, TeachingPattern, TeachingNotesData } from "./shared.js";

export const queryTeachingWisdomTool = tool(
  "query_teaching_wisdom",
  "Query accumulated teaching wisdom for a domain. Returns teaching notes and patterns relevant to specific skills, note types, or general domain wisdom. Use this when composing lesson plans to incorporate insights from previous sessions, or when an educator asks 'what have you learned about teaching X?'",
  {
    domain: z.string().describe("Skill domain slug (e.g. 'python-data-analysis')"),
    skillIds: z
      .array(z.string())
      .optional()
      .describe("Filter notes by specific skill IDs. If omitted, returns all notes."),
    noteTypes: z
      .array(
        z.enum([
          "timing",
          "success_pattern",
          "confusion_point",
          "failure_pattern",
          "activity_recommendation",
          "group_composition",
          "accessibility",
        ])
      )
      .optional()
      .describe("Filter by note type. If omitted, returns all types."),
    minConfidence: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe("Minimum confidence threshold (0-1). Default: 0.0 (all notes)."),
    includePatterns: z
      .boolean()
      .optional()
      .describe("Whether to include cross-skill patterns. Default: true."),
    groupLevel: z
      .string()
      .optional()
      .describe("Filter notes applicable to this group level (e.g. 'beginner', 'intermediate', 'advanced')"),
  },
  async ({ domain, skillIds, noteTypes, minConfidence, includePatterns, groupLevel }) => {
    const notesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.json");

    let data: TeachingNotesData;
    try {
      const raw = await fs.readFile(notesPath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      return toolResponse({
        domain,
        found: false,
        message: `No teaching wisdom found for domain '${domain}'. This domain hasn't accumulated any teaching notes yet. After sessions are taught and debriefed, wisdom will accumulate here.`,
        notes: [],
        patterns: [],
      });
    }

    const threshold = minConfidence ?? 0;

    // Filter notes
    let filteredNotes = data.notes.filter((n) => n.confidence >= threshold);

    if (skillIds && skillIds.length > 0) {
      filteredNotes = filteredNotes.filter((n) => skillIds.includes(n.skillId));
    }

    if (noteTypes && noteTypes.length > 0) {
      filteredNotes = filteredNotes.filter((n) =>
        noteTypes.includes(n.type as typeof noteTypes[number])
      );
    }

    if (groupLevel) {
      filteredNotes = filteredNotes.filter((n) => {
        const ctx = n.context.groupLevel as string | undefined;
        if (!ctx || ctx === "any") return true;
        return ctx.includes(groupLevel);
      });
    }

    // Sort by confidence descending, then by sessionCount
    filteredNotes.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.sessionCount - a.sessionCount;
    });

    // Filter patterns
    let filteredPatterns: TeachingPattern[] = [];
    if (includePatterns !== false) {
      filteredPatterns = data.patterns.filter((p) => p.confidence >= threshold);

      if (skillIds && skillIds.length > 0) {
        filteredPatterns = filteredPatterns.filter((p) =>
          p.affectedSkills.some((s) => skillIds.includes(s))
        );
      }

      filteredPatterns.sort((a, b) => b.confidence - a.confidence);
    }

    // Build summary for the agent
    const typeCounts: Record<string, number> = {};
    for (const n of filteredNotes) {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    }

    return toolResponse({
      domain,
      found: true,
      totalSessionsAnalyzed: data.sessionCount,
      lastUpdated: data.lastUpdated,
      query: {
        skillIds: skillIds ?? "all",
        noteTypes: noteTypes ?? "all",
        minConfidence: threshold,
        groupLevel: groupLevel ?? "all",
      },
      summary: {
        notesReturned: filteredNotes.length,
        patternsReturned: filteredPatterns.length,
        noteTypeBreakdown: typeCounts,
        avgConfidence:
          filteredNotes.length > 0
            ? Math.round(
                (filteredNotes.reduce((s, n) => s + n.confidence, 0) /
                  filteredNotes.length) *
                  100
              ) / 100
            : 0,
      },
      notes: filteredNotes,
      patterns: filteredPatterns,
    });
  }
);
