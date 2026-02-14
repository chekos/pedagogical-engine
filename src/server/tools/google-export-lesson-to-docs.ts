import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { createDoc, type DocBlock } from "../google/docs.js";
import { shareFile } from "../google/drive.js";

const docBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("heading1"), text: z.string() }),
  z.object({ type: z.literal("heading2"), text: z.string() }),
  z.object({ type: z.literal("heading3"), text: z.string() }),
  z.object({
    type: z.literal("paragraph"),
    text: z.string().describe("Plain text. Use **bold** and *italic* for inline formatting."),
  }),
  z.object({
    type: z.literal("bullets"),
    items: z
      .array(z.string())
      .describe("Bullet items. Use **bold** and *italic* within items."),
  }),
  z.object({
    type: z.literal("numbered_list"),
    items: z.array(z.string()).describe("Numbered list items."),
  }),
  z.object({
    type: z.literal("checklist"),
    items: z
      .array(z.string())
      .describe("Checkbox items — renders as interactive checkboxes in Google Docs."),
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string()).describe("Column headers (shown bold with background)."),
    rows: z
      .array(z.array(z.string()))
      .describe("Data rows. Use **bold** for emphasis in cells."),
  }),
  z.object({ type: z.literal("divider") }),
]);

export const googleExportLessonToDocsTool = tool(
  "export_lesson_to_docs",
  `Export content to a formatted Google Doc with native rich formatting.

You produce the document structure — the tool handles the Google Docs API mechanics (index tracking, batchUpdate requests, table cell population).

AVAILABLE BLOCK TYPES:
- heading1/heading2/heading3: Section headings
- paragraph: Text with **bold** and *italic* inline formatting
- bullets: Unordered list (supports **bold** and *italic* in items)
- numbered_list: Ordered/numbered list
- checklist: Interactive checkbox items (great for preparation lists)
- table: Real Google Docs table with header row styling. Provide headers[] and rows[][] separately.
- divider: Horizontal rule separator

INLINE FORMATTING:
Use **double asterisks** for bold and *single asterisks* for italic within any text string (paragraphs, bullet items, table cells, etc.). The tool strips the markers and applies native Google Docs formatting.

TABLES:
Provide headers and rows as separate arrays. The header row gets a light purple background automatically. Example:
  { type: "table", headers: ["Field", "Value"], rows: [["**Topic**", "Data analysis"], ["**Duration**", "90 min"]] }

BEST PRACTICES:
- Use checklist blocks for preparation/prerequisite items (renders as checkboxes the educator can tick off)
- Use tables for structured key-value data (session overview, tool requirements, logistics)
- Use numbered_list for learning objectives
- Use divider between major sections
- Keep paragraph text concise — one idea per paragraph block`,
  {
    title: z.string().describe("Document title"),
    blocks: z.array(docBlockSchema).describe("Ordered content blocks that make up the document."),
    shareWith: z
      .array(z.string())
      .optional()
      .describe("Email addresses to share the Doc with (reader access)"),
  },
  async ({ title, blocks, shareWith }) => {
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
    const result = await createDoc(auth, title, blocks as DocBlock[]);

    const shareResults: string[] = [];
    if (shareWith && shareWith.length > 0) {
      for (const email of shareWith) {
        try {
          await shareFile(auth, result.docId, email, "reader");
          shareResults.push(`Shared with ${email}`);
        } catch (err) {
          shareResults.push(
            `Failed to share with ${email}: ${err instanceof Error ? err.message : "unknown error"}`
          );
        }
      }
    }

    return toolResponse({
      docId: result.docId,
      docUrl: result.docUrl,
      title,
      ...(shareResults.length > 0 && { sharing: shareResults }),
    });
  }
);
