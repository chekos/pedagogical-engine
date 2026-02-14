import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { createPresentation, type SlideContent } from "../google/slides.js";
import { shareFile } from "../google/drive.js";

const slideSchema = z.object({
  layout: z
    .enum(["content", "section_header"])
    .optional()
    .default("content")
    .describe('"content" = title + bullet body (default). "section_header" = large centered title only.'),
  title: z.string().describe("Slide title. Include timing if relevant, e.g. 'Core Activity (15 min)'."),
  bullets: z
    .array(z.string())
    .optional()
    .describe("Key points for the slide face. Max 6 for readability. Ignored for section_header."),
  speakerNotes: z
    .string()
    .optional()
    .describe("Detailed presenter notes — full talking points, contingencies, watch-for items. Not visible during presentation unless presenter view is on."),
});

export const googleExportLessonToSlidesTool = tool(
  "export_lesson_to_slides",
  `Export content to a Google Slides presentation with proper formatting.

You decide the slide structure — the tool handles the Slides API mechanics (layout creation, text insertion, bullet formatting, speaker notes).

SLIDE STRUCTURE:
Each slide has: layout, title, bullets (max 6), and speakerNotes.
- "content" layout: title bar + bulleted body. Good for most slides.
- "section_header" layout: large centered title. Good for phase transitions ("Phase 2: Core Activity").

SPEAKER NOTES:
Put detailed content in speakerNotes — full talking points, contingency plans, timing notes, things to watch for. The slide face should be clean with just key points. The presenter sees notes in presenter view.

BEST PRACTICES FOR EDUCATIONAL SLIDES:
- Title slide is created automatically from the title and subtitle parameters
- Keep bullet text short — one line per point, max 6 bullets per slide
- Use section_header slides to mark phase transitions
- Put ALL the detail in speakerNotes — that's where the teacher looks during the lesson
- A 50-minute lesson plan typically needs 8-12 slides (not 25+)
- Group related content onto one slide rather than making many thin slides`,
  {
    title: z.string().describe("Presentation title"),
    subtitle: z.string().optional().default("").describe("Subtitle shown on title slide (e.g. 'Prepared for: Tuesday Cohort')"),
    slides: z.array(slideSchema).describe("Ordered slide descriptions."),
    shareWith: z
      .array(z.string())
      .optional()
      .describe("Email addresses to share the presentation with (reader access)"),
  },
  async ({ title, subtitle, slides, shareWith }) => {
    const status = await googleAuth.getStatus();
    if (!status.connected) {
      return toolResponse(
        {
          error:
            "Google account not connected. Call request_google_connection first.",
        },
        true
      );
    }

    const auth = googleAuth.getClient();
    const result = await createPresentation(
      auth,
      title,
      subtitle || "",
      slides as SlideContent[]
    );

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
      title,
      ...(shareResults.length > 0 && { sharing: shareResults }),
    });
  }
);
