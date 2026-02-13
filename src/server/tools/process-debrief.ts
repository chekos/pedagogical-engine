import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = process.env.DATA_DIR || "./data";

export const processDebriefTool = tool(
  "process_debrief",
  "Process a post-session debrief for a lesson plan. Updates learner profiles with observational evidence, records timing adjustments, saves teaching notes, and writes the debrief to data/debriefs/. All profile updates from debriefs are tagged as 'observational' with confidence discounts vs. assessment evidence.",
  {
    lessonId: z
      .string()
      .describe("Lesson plan filename without .md extension"),
    groupName: z.string().describe("Group slug"),
    domain: z.string().describe("Skill domain"),
    overallRating: z
      .enum(["great", "good", "mixed", "rough", "difficult"])
      .describe("Overall session rating from educator"),
    overallNotes: z
      .string()
      .describe("Educator's overall impression of the session"),
    sectionFeedback: z
      .array(
        z.object({
          sectionTitle: z.string().describe("Title of the lesson section"),
          timing: z
            .enum(["as_planned", "shorter", "longer", "skipped"])
            .describe("How timing compared to plan"),
          timingDelta: z
            .number()
            .optional()
            .describe(
              "Minutes over (+) or under (-) planned time, if known"
            ),
          engagement: z
            .enum(["high", "moderate", "low", "mixed"])
            .describe("Student engagement level"),
          notes: z.string().optional().describe("Educator notes for section"),
          surprises: z
            .string()
            .optional()
            .describe("Unexpected things that happened"),
          usedContingency: z
            .boolean()
            .optional()
            .describe("Whether the contingency plan was used"),
        })
      )
      .describe("Per-section feedback from the lesson plan"),
    learnerObservations: z
      .array(
        z.object({
          learnerId: z.string().describe("Learner file ID"),
          observations: z.array(
            z.object({
              skillId: z
                .string()
                .describe("Skill ID from the domain graph"),
              type: z
                .enum([
                  "struggled",
                  "succeeded",
                  "helped_others",
                  "disengaged",
                  "breakthrough",
                  "other",
                ])
                .describe("Type of observation"),
              detail: z
                .string()
                .describe("The educator's exact observation"),
              confidenceChange: z
                .number()
                .min(-0.3)
                .max(0.3)
                .describe(
                  "Confidence adjustment (-0.3 to +0.3, observational range)"
                ),
              bloomLevelChange: z
                .string()
                .optional()
                .describe(
                  "New Bloom's level if observation warrants a level change"
                ),
            })
          ),
        })
      )
      .optional()
      .describe("Per-learner observations from the educator"),
    unplannedMoments: z
      .string()
      .optional()
      .describe("Things that happened outside the plan"),
    educatorReflection: z
      .string()
      .optional()
      .describe("What the educator would change next time"),
    teachingNotes: z
      .array(
        z.object({
          skillId: z.string().describe("Related skill ID"),
          noteType: z
            .enum([
              "what_worked",
              "what_struggled",
              "prerequisite_gap",
              "activity_idea",
            ])
            .describe("Type of teaching note"),
          note: z.string().describe("The teaching note content"),
        })
      )
      .optional()
      .describe("Domain-level teaching notes for future sessions"),
  },
  async ({
    lessonId,
    groupName,
    domain,
    overallRating,
    overallNotes,
    sectionFeedback,
    learnerObservations,
    unplannedMoments,
    educatorReflection,
    teachingNotes,
  }) => {
    const now = new Date();
    const debriefDir = path.join(DATA_DIR, "debriefs");
    await fs.mkdir(debriefDir, { recursive: true });

    // --- 1. Update learner profiles with observational evidence ---
    const profileUpdates: Array<{
      learnerId: string;
      skillId: string;
      type: string;
      confidenceChange: number;
      detail: string;
    }> = [];

    if (learnerObservations && learnerObservations.length > 0) {
      for (const learner of learnerObservations) {
        const learnerPath = path.join(
          DATA_DIR,
          "learners",
          `${learner.learnerId}.md`
        );

        let content: string;
        try {
          content = await fs.readFile(learnerPath, "utf-8");
        } catch {
          // Learner not found — skip
          continue;
        }

        // Append observational notes to the Notes section
        const observationLines = learner.observations.map((obs) => {
          const arrow =
            obs.confidenceChange >= 0
              ? `+${obs.confidenceChange}`
              : `${obs.confidenceChange}`;
          return `- [${now.toISOString().slice(0, 10)}] ${obs.type}: ${obs.detail} (${obs.skillId}: ${arrow} confidence, observational)`;
        });

        const obsBlock = `\n### Debrief Observations (${now.toISOString().slice(0, 10)})\n\n${observationLines.join("\n")}\n`;

        if (content.includes("## Notes")) {
          // Append before the end of the Notes section
          const parts = content.split("## Notes");
          content = parts[0] + "## Notes" + parts[1] + "\n" + obsBlock;
        } else {
          content = content.trimEnd() + "\n\n## Notes\n" + obsBlock;
        }

        // Update the "Last assessed" date to reflect the debrief
        content = content.replace(
          /\| \*\*Last assessed\*\* \| .+ \|/,
          `| **Last assessed** | ${now.toISOString()} (debrief) |`
        );

        await fs.writeFile(learnerPath, content, "utf-8");

        for (const obs of learner.observations) {
          profileUpdates.push({
            learnerId: learner.learnerId,
            skillId: obs.skillId,
            type: obs.type,
            confidenceChange: obs.confidenceChange,
            detail: obs.detail,
          });
        }
      }
    }

    // --- 2. Record timing adjustments ---
    const timingAdjustments = sectionFeedback
      .filter((s) => s.timing !== "as_planned")
      .map((s) => ({
        section: s.sectionTitle,
        timing: s.timing,
        delta: s.timingDelta ?? null,
        notes: s.notes ?? "",
      }));

    // --- 3. Save teaching notes to the domain directory ---
    if (teachingNotes && teachingNotes.length > 0) {
      const notesPath = path.join(
        DATA_DIR,
        "domains",
        domain,
        "teaching-notes.md"
      );

      let existing = "";
      try {
        existing = await fs.readFile(notesPath, "utf-8");
      } catch {
        existing = `# Teaching Notes: ${domain}\n\nObservational notes from post-session debriefs. These inform future lesson composition.\n`;
      }

      const newNotes = teachingNotes
        .map(
          (n) =>
            `- **[${now.toISOString().slice(0, 10)}]** (${n.noteType}) ${n.skillId}: ${n.note}`
        )
        .join("\n");

      existing = existing.trimEnd() + "\n\n" + newNotes + "\n";
      await fs.writeFile(notesPath, existing, "utf-8");
    }

    // --- 4. Write the debrief document ---
    const sectionLines = sectionFeedback
      .map((s) => {
        let line = `### ${s.sectionTitle}\n\n`;
        line += `| Aspect | Value |\n|---|---|\n`;
        line += `| **Timing** | ${s.timing}${s.timingDelta ? ` (${s.timingDelta > 0 ? "+" : ""}${s.timingDelta} min)` : ""} |\n`;
        line += `| **Engagement** | ${s.engagement} |\n`;
        if (s.usedContingency !== undefined) {
          line += `| **Used contingency** | ${s.usedContingency ? "Yes" : "No"} |\n`;
        }
        if (s.notes) line += `\n${s.notes}\n`;
        if (s.surprises) line += `\n**Surprises:** ${s.surprises}\n`;
        return line;
      })
      .join("\n");

    const learnerLines =
      learnerObservations && learnerObservations.length > 0
        ? learnerObservations
            .map((l) => {
              const obsLines = l.observations
                .map(
                  (o) =>
                    `- **${o.type}** on ${o.skillId}: ${o.detail} (confidence: ${o.confidenceChange >= 0 ? "+" : ""}${o.confidenceChange})`
                )
                .join("\n");
              return `### ${l.learnerId}\n\n${obsLines}`;
            })
            .join("\n\n")
        : "_No individual observations recorded._";

    const teachingNotesLines =
      teachingNotes && teachingNotes.length > 0
        ? teachingNotes
            .map((n) => `- (${n.noteType}) **${n.skillId}**: ${n.note}`)
            .join("\n")
        : "_No teaching notes recorded._";

    const debriefContent = `# Post-Session Debrief: ${lessonId}

| Field | Value |
|---|---|
| **Lesson** | ${lessonId} |
| **Group** | ${groupName} |
| **Domain** | ${domain} |
| **Date** | ${now.toISOString()} |
| **Overall rating** | ${overallRating} |

## Overall Impression

${overallNotes}

## Section-by-Section Feedback

${sectionLines}

## Learner Observations

${learnerLines}

## Unplanned Moments

${unplannedMoments || "_Nothing reported._"}

## Educator Reflection

${educatorReflection || "_No reflection recorded._"}

## Teaching Notes

${teachingNotesLines}

## System Updates Applied

- **Learner profiles updated:** ${profileUpdates.length} observation(s) across ${new Set(profileUpdates.map((p) => p.learnerId)).size} learner(s)
- **Timing adjustments recorded:** ${timingAdjustments.length} section(s)
- **Teaching notes saved:** ${teachingNotes?.length ?? 0} note(s)
`;

    const debriefFilename = `${lessonId}-debrief-${now.toISOString().slice(0, 10)}.md`;
    const debriefPath = path.join(debriefDir, debriefFilename);
    await fs.writeFile(debriefPath, debriefContent, "utf-8");

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              debriefSaved: true,
              debriefPath,
              debriefFilename,
              lessonId,
              groupName,
              domain,
              overallRating,
              profileUpdates: {
                count: profileUpdates.length,
                learners: [
                  ...new Set(profileUpdates.map((p) => p.learnerId)),
                ],
                updates: profileUpdates,
              },
              timingAdjustments,
              teachingNotesSaved: teachingNotes?.length ?? 0,
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
