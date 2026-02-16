import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { DATA_DIR, toolResponse } from "./shared.js";

export const shareNoteWithLearnerTool = tool(
  "share_note_with_learner",
  "Share an educator note with a learner's portal page. Writes to data/notes/{learner-id}/note-{timestamp}.json. Notes are visible on the learner's portal page.",
  {
    learnerId: z
      .string()
      .describe("Learner ID (filename without extension, e.g. 'priya-sharma')"),
    groupId: z.string().describe("Group slug (e.g. 'tuesday-cohort')"),
    content: z
      .string()
      .describe(
        "The note content to share with the learner. This is the educator's message — can be plain text or markdown."
      ),
    audienceHint: z
      .enum(["learner", "parent", "employer", "general"])
      .optional()
      .describe(
        "Who this note is primarily intended for. Affects how the portal renders the note. Defaults to 'general'."
      ),
    pinned: z
      .boolean()
      .optional()
      .describe(
        "If true, this note stays at the top of the learner's portal page. Defaults to false."
      ),
  },
  async ({ learnerId, groupId, content, audienceHint, pinned }) => {
    // Verify the learner exists
    const learnerPath = path.join(DATA_DIR, "learners", `${learnerId}.md`);
    try {
      await fs.access(learnerPath);
    } catch {
      return toolResponse(
        { error: `Learner profile '${learnerId}' not found` },
        true
      );
    }

    // Create the notes directory for this learner
    const notesDir = path.join(DATA_DIR, "notes", learnerId);
    await fs.mkdir(notesDir, { recursive: true });

    // Generate note ID and timestamp
    const now = new Date();
    const dateSlug = now.toISOString().slice(0, 10);
    const noteId = `note-${dateSlug}-${nanoid(4).toLowerCase()}`;

    const note = {
      id: noteId,
      learnerId,
      groupId,
      createdAt: now.toISOString(),
      content,
      audienceHint: audienceHint ?? "general",
      pinned: pinned ?? false,
    };

    // Write the note file
    const notePath = path.join(notesDir, `${noteId}.json`);
    await fs.writeFile(notePath, JSON.stringify(note, null, 2), "utf-8");

    return toolResponse({
      noteId,
      learnerId,
      groupId,
      audienceHint: note.audienceHint,
      pinned: note.pinned,
      preview: content.length > 200 ? content.slice(0, 200) + "..." : content,
      file: notePath,
      message: `Note shared with ${learnerId}'s portal page.`,
    });
  }
);
