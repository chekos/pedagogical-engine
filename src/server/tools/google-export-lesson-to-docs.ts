import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";
import { toolResponse } from "./shared.js";
import { googleAuth } from "../google/auth.js";
import { uploadFile } from "../google/drive.js";
import { shareFile } from "../google/drive.js";

export const googleExportLessonToDocsTool = tool(
  "export_lesson_to_docs",
  `Upload a .docx file to Google Drive and convert it to a Google Doc.

Use the docx skill to create the .docx file first, then call this tool with the file path.
The file is automatically converted to native Google Docs format on upload.`,
  {
    filePath: z
      .string()
      .describe("Absolute path to the .docx file to upload"),
    title: z
      .string()
      .describe("Display name for the Google Doc"),
    shareWith: z
      .array(z.string())
      .optional()
      .describe("Email addresses to share the Doc with (reader access)"),
  },
  async ({ filePath, title, shareWith }) => {
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
    const result = await uploadFile(auth, filePath, title, true);

    const shareResults: string[] = [];
    if (shareWith && shareWith.length > 0) {
      for (const email of shareWith) {
        try {
          await shareFile(auth, result.fileId, email, "reader");
          shareResults.push(`Shared with ${email}`);
        } catch (err) {
          shareResults.push(
            `Failed to share with ${email}: ${err instanceof Error ? err.message : "unknown error"}`
          );
        }
      }
    }

    return toolResponse({
      fileId: result.fileId,
      url: result.url,
      title,
      convertedTo: result.mimeType,
      ...(shareResults.length > 0 && { sharing: shareResults }),
    });
  }
);
