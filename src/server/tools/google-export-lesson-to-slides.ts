import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import { DATA_DIR, toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { createPresentation } from "../google/slides.js";
import { shareFile } from "../google/drive.js";

export const googleExportLessonToSlidesTool = tool(
  "export_lesson_to_slides",
  "Export a lesson plan to a Google Slides presentation. Each section becomes a slide with the section title and key content. Ideal for projecting during a lesson.",
  {
    lessonId: z.string().describe("Lesson plan ID (filename without .md)"),
    title: z
      .string()
      .optional()
      .describe("Custom title for the presentation. If omitted, uses the lesson plan title."),
    shareWith: z
      .array(z.string())
      .optional()
      .describe("Email addresses to share the presentation with (reader access)"),
  },
  async ({ lessonId, title, shareWith }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        { error: "Google account not connected. Call request_google_connection first." },
        true
      );
    }

    // Read the lesson plan
    const lessonPath = path.join(DATA_DIR, "lessons", `${lessonId}.md`);
    let content: string;
    try {
      content = await fs.readFile(lessonPath, "utf-8");
    } catch {
      return toolResponse(
        { error: `Lesson plan '${lessonId}' not found at ${lessonPath}` },
        true
      );
    }

    // Extract title from content if not provided
    const effectiveTitle =
      title ||
      content.match(/^# (.+)$/m)?.[1] ||
      `Lesson Plan: ${lessonId}`;

    const auth = googleAuth.getClient();
    const result = await createPresentation(auth, effectiveTitle, content);

    // Share if requested
    const shareResults: string[] = [];
    if (shareWith && shareWith.length > 0) {
      for (const email of shareWith) {
        try {
          await shareFile(auth, result.presentationId, email, "reader");
          shareResults.push(`Shared with ${email}`);
        } catch (err) {
          shareResults.push(
            `Failed to share with ${email}: ${err instanceof Error ? err.message : "unknown error"}`
          );
        }
      }
    }

    return toolResponse({
      presentationId: result.presentationId,
      presentationUrl: result.presentationUrl,
      slideCount: result.slideCount,
      title: effectiveTitle,
      ...(shareResults.length > 0 && { sharing: shareResults }),
    });
  }
);
