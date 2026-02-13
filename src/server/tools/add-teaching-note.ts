import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

interface TeachingNote {
  id: string;
  skillId: string;
  type: string;
  observation: string;
  confidence: number;
  sessionCount: number;
  confirmedIn: string[];
  context: Record<string, unknown>;
  source: string;
  createdAt: string;
  updatedAt: string;
}

interface TeachingPattern {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedSkills: string[];
  confidence: number;
  sessionCount: number;
  recommendation: string;
  createdAt: string;
}

interface TeachingNotesData {
  domain: string;
  version: string;
  sessionCount: number;
  lastUpdated: string;
  notes: TeachingNote[];
  patterns: TeachingPattern[];
}

export const addTeachingNoteTool = tool(
  "add_teaching_note",
  "Add a teaching note directly from an educator. These notes have high confidence because the educator is explicitly flagging something for future sessions. Use this when an educator says things like 'Remember this for next time' or 'This is important for future sessions.' Also supports confirming or reinforcing existing notes.",
  {
    domain: z.string().describe("Skill domain slug"),
    skillId: z.string().describe("Related skill ID from the domain graph"),
    type: z
      .enum([
        "timing",
        "success_pattern",
        "confusion_point",
        "failure_pattern",
        "activity_recommendation",
        "group_composition",
        "accessibility",
      ])
      .describe("Type of teaching note"),
    observation: z
      .string()
      .describe(
        "The teaching observation or note content. Be specific and actionable."
      ),
    sessionRef: z
      .string()
      .optional()
      .describe("Reference to the session that generated this note (lesson ID or debrief ID)"),
    context: z
      .object({
        groupLevel: z
          .string()
          .optional()
          .describe("Applicable group level (e.g. 'beginner', 'intermediate', 'advanced', 'any')"),
        setting: z
          .string()
          .optional()
          .describe("Applicable setting (e.g. 'classroom', 'online', 'workshop', 'any')"),
        minGroupSize: z.number().optional().describe("Minimum group size this applies to"),
        maxGroupSize: z.number().optional().describe("Maximum group size this applies to"),
      })
      .optional()
      .describe("Context where this note is applicable"),
  },
  async ({ domain, skillId, type, observation, sessionRef, context }) => {
    const now = new Date();
    const notesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.json");

    // Load or initialize
    let data: TeachingNotesData;
    try {
      const raw = await fs.readFile(notesPath, "utf-8");
      data = JSON.parse(raw);
    } catch {
      data = {
        domain,
        version: "1.0.0",
        sessionCount: 0,
        lastUpdated: now.toISOString(),
        notes: [],
        patterns: [],
      };
    }

    // Generate ID
    const maxId = data.notes.reduce((max, n) => {
      const num = parseInt(n.id.replace("tn-", ""));
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    const newId = `tn-${String(maxId + 1).padStart(3, "0")}`;

    const newNote: TeachingNote = {
      id: newId,
      skillId,
      type,
      observation,
      confidence: 0.85, // Educator-direct notes start at high confidence
      sessionCount: 1,
      confirmedIn: sessionRef ? [sessionRef] : [],
      context: {
        groupLevel: context?.groupLevel ?? "any",
        setting: context?.setting ?? "any",
        ...(context?.minGroupSize !== undefined && { minGroupSize: context.minGroupSize }),
        ...(context?.maxGroupSize !== undefined && { maxGroupSize: context.maxGroupSize }),
      },
      source: "educator_direct",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    data.notes.push(newNote);
    data.lastUpdated = now.toISOString();

    // Also append to the markdown teaching notes file for human readability
    const mdNotesPath = path.join(DATA_DIR, "domains", domain, "teaching-notes.md");
    let mdContent = "";
    try {
      mdContent = await fs.readFile(mdNotesPath, "utf-8");
    } catch {
      mdContent = `# Teaching Notes: ${domain}\n\nObservational notes from post-session debriefs. These inform future lesson composition.\n`;
    }

    const noteTypeMap: Record<string, string> = {
      timing: "timing",
      success_pattern: "what_worked",
      confusion_point: "what_struggled",
      failure_pattern: "what_struggled",
      activity_recommendation: "activity_idea",
      group_composition: "what_worked",
      accessibility: "prerequisite_gap",
    };

    const mdNoteType = noteTypeMap[type] ?? type;
    mdContent =
      mdContent.trimEnd() +
      `\n- **[${now.toISOString().slice(0, 10)}]** (${mdNoteType}) ${skillId}: ${observation}\n`;

    // Write both files
    await Promise.all([
      fs.writeFile(notesPath, JSON.stringify(data, null, 2), "utf-8"),
      fs.writeFile(mdNotesPath, mdContent, "utf-8"),
    ]);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              added: true,
              noteId: newId,
              domain,
              skillId,
              type,
              observation,
              confidence: newNote.confidence,
              source: "educator_direct",
              totalNotesInDomain: data.notes.length,
              timestamp: now.toISOString(),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);
